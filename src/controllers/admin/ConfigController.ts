import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';
import { Like } from 'typeorm';

import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { Config } from '../../entity/Config';

export enum CONFIG_PARAMS {
    commissionFood = 'COMMISSION_FOOD',
    commissionDelivery = 'COMMISSION_DELIVERY',
    commissionTransport = 'COMMISSION_TRANSPORT'
}

@Controller("/admin/config")
@Docs("docs_admin")
export class ConfigController {

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
        @QueryParams("limit") limit: number,
        @QueryParams("search") search: string = "",
        @Req() req: Request,
        @Res() res: Response
    ) {
        const where = {
            title: Like(`%${search}%`),
        }

        let [config, total] = await Config.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
            where,
            order: { id: "DESC" },
        })

        return res.sendOK({ data: config, total }, "Success")
    }

    // =====================GET ITEM=====================
    @Get('/:configId')
    @UseAuth(VerificationJWT)
    @Validator({
        configId: Joi.number().required(),
    })
    async findOne(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @PathParams("configId") configId: number,

    ) {
        configId = Number(configId)
        let config = await Config.findOneOrThrowId(configId)
        return config
    }

    // =====================CREATE ITEM=====================
    @Post('')
    @UseAuth(VerificationJWT)
    @Validator({
        config: Joi.required(),
    })
    async create(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams("config") config: Config,
    ) {
        await config.save()
        return { id: config.id }
    }
    // =====================UPDATE ITEM=====================
    @Post('/:configId/update')
    @UseAuth(VerificationJWT)
    @Validator({
        config: Joi.required(),
        configId: Joi.number().required()
    })
    async update(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams("config") config: Config,
        @PathParams("configId") configId: number,
    ) {
        configId = Number(configId)
        // This will check and throw error if not exist 
        await Config.findOneOrThrowId(configId)
        config.id = configId
        await config.save()
        return { id: config.id }
    }

}
