import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';
import { Like } from 'typeorm';

import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { Encourage } from '../../entity/Encourage';

@Controller("/admin/encourage")
@Docs("docs_admin")
export class EncourageController {
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
        const where = {
            title: Like(`%${search}%`),
        }

        let [encourage, total] = await Encourage.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
            where,
            order: { money: "ASC" },
        })

        return res.sendOK({ data: encourage, total }, "Success")
    }

    // =====================GET ITEM=====================
    @Get('/:encourageId')
    @UseAuth(VerificationJWT)
    @Validator({
        encourageId: Joi.number().required(),
    })
    async findOne(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @PathParams("encourageId") encourageId: number,

    ) {
        encourageId = Number(encourageId)
        let encourage = await Encourage.findOneOrThrowId(encourageId)
        return encourage
    }

    // =====================CREATE ITEM=====================
    @Post('')
    @UseAuth(VerificationJWT)
    @Validator({
        encourage: Joi.required(),
    })
    async create(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams("encourage") encourage: Encourage,
    ) {
        await encourage.save()
        return { id: encourage.id }
    }

    // =====================UPDATE ITEM=====================
    @Post('/:encourageId/update')
    @UseAuth(VerificationJWT)
    @Validator({
        encourage: Joi.required(),
        encourageId: Joi.number().required()
    })
    async update(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams("encourage") encourage: Encourage,
        @PathParams("encourageId") encourageId: number,
    ) {
        encourageId = Number(encourageId)
        // This will check and throw error if not exist 
        await Encourage.findOneOrThrowId(encourageId)
        encourage.id = encourageId
        await encourage.save()
        return { id: encourage.id }
    }

}
