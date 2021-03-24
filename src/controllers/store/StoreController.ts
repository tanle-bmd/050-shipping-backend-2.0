// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';
import { Like } from 'typeorm';


// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { Store } from '../../entity/Store';
import JWT, { AuthType } from '../../middleware/auth/strategy/JWT';
import { validatePassword, hashPassword } from '../../util/passwordHelper';
import { MulterOptions, MultipartFile } from '@tsed/multipartfiles';
import config from '../../../config';


@Controller("/store/auth")
@Docs("docs_store")
export class StoreController {
    constructor() { }

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
        const store = await Store.findOne({
            select: ['id', 'phone', 'password', 'isBlock'],
            where: {
                username
            }
        })

        if (!store) {
            return res.sendClientError('Tài khoản không tồn tại')
        }

        if (store.isBlock) {
            return res.sendClientError('Tài khoản đã bị khoá')
        }

        const isCorrectPass = await validatePassword(password, store.password)
        if (!isCorrectPass) {
            return res.sendClientError('Mật khẩu không chính xác.')
        }

        const token = JWT.sign({ id: store.id, type: AuthType.Store })

        return { token }
    }

    // =====================GET INFO=====================
    @Get('/profile')
    @UseAuth(VerificationJWT)
    async getInfo(
        @HeaderParams("token") token: string,
        @Req() req: Request
    ) {
        return req.store
    }

    // =====================UPDATE ITEM=====================
    @Post('/profile')
    @UseAuth(VerificationJWT)
    @Validator({
        store: Joi.required()
    })
    async update(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams("store") store: Store,
    ) {
        // This will check and throw error if not exist 
        store.id = req.store.id
        await store.save()
        return { id: store.id }
    }

    // =====================UPDATE ITEM=====================
    @Post('/password/update')
    @UseAuth(VerificationJWT)
    @Validator({
        oldPassword: Joi.required(),
        newPassword: Joi.required()
    })
    async updatePassword(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams("oldPassword") oldPassword: string,
        @BodyParams("newPassword") newPassword: string,
    ) {
        const { id } = req.store

        const store = await Store.findOneOrThrowOption({
            select: ["password", "id"],
            where: { id }
        })

        let validate = await validatePassword(oldPassword, store.password)
        if (!validate) return res.sendClientError("Mật khẩu cũ không đúng");

        if (oldPassword == newPassword) return res.sendClientError("Mật khẩu mới không được trùng mật khẩu cũ", {})

        // update password
        store.password = await hashPassword(newPassword)
        await store.save()

        return res.sendOK({}, "Cập nhật mật khẩu thành công")

    }

    // =====================UPLOAD IMAGE=====================
    @Post('/image/upload')
    @MulterOptions({})
    @UseAuth(VerificationJWT)
    uploadFile(
        @MultipartFile('image') file: Express.Multer.File,
        @HeaderParams("token") token: string) {
        file.path = file.path.replace(config.UPLOAD_DIR, "");
        return file
    }

} // END FILE
