import { Controller, UseAuth, Req, Get, Res, Response, HeaderParams, PathParams, Post, BodyParams, QueryParams } from '@tsed/common';
import Joi from '@hapi/joi';
import { Docs } from '@tsed/swagger';
import { Request } from 'express';

import { Validator } from '../../middleware/validator/Validator';
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Staff } from '../../entity/Staff';
import { StaffService } from '../../services/StaffService';
import JWT, { AuthType } from '../../middleware/auth/strategy/JWT';
import { hashPassword } from '../../util/passwordHelper';
import { Raw } from 'typeorm';
import { Role } from '../../entity/Role';
import { AdminUpdate } from '../../entity-request/AdminUpdate';
import { MultipartFile, MulterOptions } from '@tsed/multipartfiles';
import config from '../../../config';

@Controller("/admin/staff")
@Docs("docs_admin")
export class StaffController {
    constructor(private staffService: StaffService) { }

    // =====================LOGIN=====================
    @Post('/login')
    @Validator({
        username: Joi.string().required(),
        password: Joi.string().required()
    })
    async login(
        @BodyParams('username') username: string,
        @BodyParams("password") password: string,
        @Req() req: Request,
        @Res() res: Response
    ) {
        let user = await this.staffService.login(username, password)
        if (!user) {
            return res.sendClientError("Tài khoản hoặc mật khẩu không đúng! Vui lòng thử lại", {})
        }
        if (user.isBlock) {
            return res.sendClientError("Tài khoản này đã bị khoá!", {})
        }

        const token = JWT.sign({ id: user.id, type: AuthType.Staff })
        return { token }
    }

    // =====================INFO=====================
    @Get('/myself/info')
    @UseAuth(VerificationJWT)
    async getInfo(
        @HeaderParams("token") token: string,
        @Req() req: Request
    ) {
        let staff = await Staff.findOneOrThrowId(req.staff.id, { relations: ['area', "role"] })
        return staff
    }

    // =====================UPDATE PASSWORD=====================
    @Post('/myself/update/password')
    @UseAuth(VerificationJWT)
    @Validator({
        oldPassword: Joi.string().required(),
        newPassword: Joi.string().required()
    })
    async changePassword(
        @Req() req: Request,
        @BodyParams('oldPassword') oldPassword: string,
        @BodyParams("newPassword") newPassword: string,
        @HeaderParams("token") token: string,
        @Res() res: Response
    ) {
        const { id } = req.staff
        if (oldPassword == newPassword) {
            return res.sendClientError("Mật khẩu mới không được trùng mật khẩu cũ", {})
        }
        // get user with old password
        const staff = await this.staffService.isValidPassword(id, oldPassword)
        if (!staff) {
            return res.sendClientError("Mật khẩu cũ không đúng");
        }
        // update password
        staff.password = await hashPassword(newPassword)
        await staff.save()
        return res.sendOK({}, "Cập nhật mật khẩu thành công")
    }

    // =====================GET PERMISSION=====================
    @Get('/myself/permission')
    @UseAuth(VerificationJWT)
    async getPermission(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const { id } = req.staff
        let permissions = await this.staffService.getPermission(id)

        return res.sendOK(permissions)
    }

    // =====================GET LIST STAFF=====================
    @Get('')
    @UseAuth(VerificationJWT)
    async findAll(
        @HeaderParams("token") token: string,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 10,
        @QueryParams("search") search: string = "",
        @QueryParams("isBlock") isBlock: boolean,
        @QueryParams('areaId') areaId: number,
        @Req() req: Request,
        @Res() res: Response
    ) {
        let where = `staff.name  LIKE '%${search}%'`

        if (req.staff.area) areaId = req.staff.area.id
        if (areaId) {
            where += ` AND area.id = ${areaId}`
        }

        let [staff, total] = await Staff.createQueryBuilder('staff')
            .leftJoinAndSelect('staff.role', 'role')
            .leftJoinAndSelect('staff.area', 'area')
            .where(where)
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('staff.id', 'DESC')
            .getManyAndCount()

        return res.sendOK({ data: staff, total })
    }

    // =====================GET ANOTHER STAFF INFO=====================
    @Get('/:staffId')
    @UseAuth(VerificationJWT)
    async findOne(
        @HeaderParams("token") token: string,
        @PathParams("staffId") staffId: number,
        @Req() req: Request,
        @Res() res: Response
    ) {
        return await Staff.findOneOrThrowId(staffId, { relations: ["role"] })
    }

    // =====================CREATE ADMIN=====================
    @Post('')
    @UseAuth(VerificationJWT)
    @Validator({
        staff: Joi.required(),
        roleId: Joi.number().required()
    })
    async create(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams("staff") staff: Staff,
        @BodyParams("roleId") roleId: number,
        @BodyParams('areaId') areaId: number,
    ) {
        //validate
        await this.staffService.checkDuplicate(staff)

        //init user to store
        staff.password = await hashPassword(staff.password)
        staff.role = new Role()
        staff.role.id = roleId
        delete staff.id

        if (req.staff.area) areaId = req.staff.area.id
        if (areaId) await staff.assignArea(areaId)

        await staff.save()

        return { id: staff.id }
    }

    // =====================UPDATE ADMIN INFO=====================
    @Post('/:staffId/update')
    @UseAuth(VerificationJWT)
    @Validator({
        info: Joi.required(),
        staffId: Joi.number().required()
    })
    async update(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams("info") info: AdminUpdate,
        @BodyParams("roleId") roleId: number,
        @PathParams("staffId") staffId: number,
        @BodyParams('areaId') areaId: number,
    ) {
        staffId = Number(staffId)
        roleId = Number(roleId)
        // validate
        await Staff.findOneOrThrowId(staffId)
        const role = await Role.findOneOrThrowId(roleId)
        //init user to store
        let staff = info.toAdmin()
        staff.id = staffId
        staff.role = role
        if (areaId) await staff.assignArea(areaId)
        if (areaId == 0) staff.area = null
        await staff.save()

        return { id: staff.id }
    }

    // =====================RESET PASSWORD=====================
    @Post('/:staffId/resetPassword')
    @UseAuth(VerificationJWT)
    @Validator({
        newPassword: Joi.string().required(),
        staffId: Joi.number().required()
    })
    async resetPassword(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams("newPassword") newPassword: string,
        @PathParams("staffId") staffId: number,
    ) {
        staffId = Number(staffId)
        // validate
        const staff = await Staff.findOneOrThrowId(staffId)
        staff.password = await hashPassword(newPassword)
        await staff.save()
        return { id: staff.id }
    }

    // =====================UPDATE ADMIN ROLE=====================
    @Post('/:staffId/update/role')
    @UseAuth(VerificationJWT)
    @Validator({
        roleId: Joi.number().required(),
        staffId: Joi.number().required()
    })
    async updateRoleAdmin(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams("roleId") roleId: number,
        @PathParams("staffId") staffId: number,
    ) {
        staffId = Number(staffId)
        // validate
        await Staff.findOneOrThrowId(staffId)
        let role = await Role.findOneOrThrowId(roleId)

        //init user to store
        let user = new Staff()
        user.id = staffId
        user.role = role

        await user.save()
        return { id: user.id }
    }

    // =====================UPLOAD AVATAR=====================
    @Post('/avatar/upload')
    @MulterOptions({})
    @UseAuth(VerificationJWT)
    uploadFile(
        @MultipartFile('avatar') file: Express.Multer.File,
        @HeaderParams("token") token: string) {
        file.path = file.path.replace(config.UPLOAD_DIR, "");
        return file
    }
}
