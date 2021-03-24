// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';

// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { Encourage } from '../../entity/Encourage';
import { Tip } from '../../entity/Tip';

// Customer - Encourage
@Controller("/customer/encourage")
@Docs("docs_customer")
export class EncourageController {
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
        @Req() req: Request,
        @Res() res: Response
    ) {
        let where = `tip.isDeleted = false`

        if (req.customer.area) {
            where += ` AND area.id = ${req.customer.area.id}`
        } else {
            return []
        }

        const tips = await Tip.createQueryBuilder('tip')
            .leftJoinAndSelect('tip.area', 'area')
            .where(where)
            .orderBy('tip.money', 'ASC')
            .getMany()

        return res.sendOK(tips)
    }

} //END FILE
