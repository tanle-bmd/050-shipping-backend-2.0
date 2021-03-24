// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';


// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { Area } from '../../entity/Area';


@Controller("/customer/area")
@Docs("docs_customer")
export class AreaController {
    constructor() { }


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
        @QueryParams("limit") limit: number = 0,
        @QueryParams("search") search: string = "",
        @Req() req: Request,
        @Res() res: Response
    ) {
        const [areas, total] = await Area.createQueryBuilder('area')
            .where(`area.name LIKE "%${search}%" AND area.isDeleted = false `)
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('area.id', 'DESC')
            .getManyAndCount()

        return res.sendOK({ areas, total });
    }


} // END FILE
