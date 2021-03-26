import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';
import { Like } from 'typeorm';

import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { Role } from '../../entity/Role';

@Controller("/admin/role")
@Docs("docs_admin")
export class RoleController {

    // =====================GET LIST=====================
    @Get('')
    @UseAuth(VerificationJWT)
    @Validator({
        page: Joi.number().min(0),
        limit: Joi.number().min(0)
    })
    async findAll(
        @HeaderParams("token") token: string,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 10,
        @QueryParams("search") search: string = "",
        @Req() req: Request,
        @Res() res: Response
    ) {
        let where = `1`
        let [role, total] = await Role.createQueryBuilder('role')
            .where(where)
            .orderBy('role.id', 'DESC')
            .getManyAndCount()

        return res.sendOK({ data: role, total }, "Success")
    }

    // =====================GET ITEM=====================
    @Get('/:roleId')
    @UseAuth(VerificationJWT)
    @Validator({
        roleId: Joi.number().required(),
    })
    async findOne(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @PathParams("roleId") roleId: number,

    ) {
        roleId = Number(roleId)
        let role = await Role.findOneOrThrowId(roleId)
        return role
    }

    // =====================CREATE ITEM=====================
    @Post('')
    @UseAuth(VerificationJWT)
    @Validator({
        role: Joi.required(),
    })
    async create(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams("role") role: Role,
    ) {
        await role.save()
        return { id: role.id }
    }

    // =====================UPDATE ITEM=====================
    @Post('/:roleId/update')
    @UseAuth(VerificationJWT)
    @Validator({
        role: Joi.required(),
        roleId: Joi.number().required()
    })
    async update(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams("role") role: Role,
        @PathParams("roleId") roleId: number,
    ) {
        roleId = Number(roleId)
        // This will check and throw error if not exist 
        await Role.findOneOrThrowId(roleId)
        role.id = roleId
        await role.save()
        return { id: role.id }
    }

}
