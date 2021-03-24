import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';
import { Like } from 'typeorm';

import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { ContentDefine, TYPE_CONTENT_DEFINE } from '../../entity/ContentDefine';

@Controller("/driver/contentDefine")
@Docs("docs_driver")
export class ContentDefineController {
    // =====================GET DETAIL=====================
    @Get('')
    @UseAuth(VerificationJWT)
    @Validator({
        type: Joi.string().required()
    })
    async findAll(
        @HeaderParams("token") token: string,
        @QueryParams("type") type: TYPE_CONTENT_DEFINE,
        @Req() req: Request,
        @Res() res: Response
    ) {
        let content = await ContentDefine.findOneOrThrowOption({
            where: {
                type
            }
        })
        return content
    }


}
