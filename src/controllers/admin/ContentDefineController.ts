import { Controller, Post, UseAuth, Res, Response, HeaderParams, BodyParams, Get, PathParams, Req, Request } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';
import { MultipartFile } from '@tsed/multipartfiles';

import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';

import { ContentDefine } from '../../entity/ContentDefine';
import config from '../../../config';


@Controller("/admin/contentDefine")
@Docs("docs_admin")
export class ContentDefineController {

    @Post('')
    @UseAuth(VerificationJWT)
    @Validator({
        contentDefine: Joi.required(),
    })
    async create(
        @HeaderParams("token") token: string,
        @BodyParams("contentDefine") contentDefine: ContentDefine,
    ) {
        await contentDefine.save()
        return { id: contentDefine.id }
    }

    @Get('')
    @UseAuth(VerificationJWT)
    @Validator({
    })
    async findAll(
        @HeaderParams("token") token: string,
        @Res() res: Response,
    ) {
        let contentDefines = await ContentDefine.find()
        return res.sendOK(contentDefines)
    }

    @Get('/:contentDefineId')
    @UseAuth(VerificationJWT)
    @Validator({
        contentDefineId: Joi.number().required(),
    })
    async findOne(
        @HeaderParams("token") token: string,
        @PathParams("contentDefineId") contentDefineId: number,

    ) {
        contentDefineId = Number(contentDefineId)
        let contentDefine = await ContentDefine.findOneOrThrowId(contentDefineId)
        return contentDefine
    }


    @Post('/:contentDefineId/update')
    @UseAuth(VerificationJWT)
    @Validator({
        contentDefine: Joi.required(),
    })
    async update(
        @HeaderParams("token") token: string,
        @BodyParams("contentDefine") contentDefine: ContentDefine,
        @PathParams("contentDefineId") contentDefineId: number,
    ) {
        contentDefineId = Number(contentDefineId)
        let oldContentDefine = await ContentDefine.findOneOrThrowId(contentDefineId)

        contentDefine.id = contentDefineId
        await contentDefine.save()
        return { id: contentDefine.id }
    }

    @Post('/:contentDefineId/delete')
    @UseAuth(VerificationJWT)
    @Validator({
    })
    async delete(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @PathParams("contentDefineId") contentDefineId: number,
    ) {
        contentDefineId = Number(contentDefineId)
        let contentDefine = await ContentDefine.findOneOrThrowId(contentDefineId)

        await contentDefine.remove()
        return { id: contentDefine.id }
    }

    @Post('/image/upload')
    @UseAuth(VerificationJWT)
    uploadFile(
        @MultipartFile('image') file: Express.Multer.File,
        @HeaderParams("token") token: string) {
        file.path = file.path.replace(config.UPLOAD_DIR, "");
        return file
    }

}
