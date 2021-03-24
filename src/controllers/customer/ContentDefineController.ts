import { Controller, UseAuth, Req, Get, Res, Response, HeaderParams, PathParams, QueryParams } from '@tsed/common';
import Joi from '@hapi/joi';
import { Docs } from '@tsed/swagger';
import { Request } from 'express';

import { Validator } from '../../middleware/validator/Validator';
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { ContentDefine, TYPE_CONTENT_DEFINE } from '../../entity/ContentDefine';
import { ContentDefineService } from '../../services/ContentDefineService';

@Controller("/customer/contentDefine")
@Docs("docs_customer")
export class ContentDefineController {
    constructor(private contentDefineService: ContentDefineService) { }

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
            where: { type }
        })
        return content
    }
}
