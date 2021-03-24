import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';
import { Like } from 'typeorm';

import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { OrderType } from '../../entity/OrderType';

@Controller("/admin/orderType")
@Docs("docs_admin")
export class OrderTypeController {

    // =====================GET LIST=====================
    @Get('/')
    @UseAuth(VerificationJWT)
    @Validator({
    })
    async findAll(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,

    ) {
        let orderType = await OrderType.find()
        res.sendOK(orderType)
    }
    // =====================GET ITEM=====================
    @Get('/:orderTypeId')
    @UseAuth(VerificationJWT)
    @Validator({
        orderTypeId: Joi.number().required(),
    })
    async findOne(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @PathParams("orderTypeId") orderTypeId: number,

    ) {
        orderTypeId = Number(orderTypeId)
        let orderType = await OrderType.findOneOrThrowId(orderTypeId)
        return orderType
    }

    // =====================CREATE ITEM=====================
    // @Post('')
    // @UseAuth(VerificationJWT)
    // @Validator({
    //     orderType: Joi.required(),
    // })
    // async create(
    //     @Req() req: Request,
    //     @Res() res: Response,
    //     @HeaderParams("token") token: string,
    //     @BodyParams("orderType") orderType: OrderType,
    // ) {
    //     await orderType.save()
    //     return { id: orderType.id }
    // }

    // =====================UPDATE ITEM=====================
    @Post('/:orderTypeId/update')
    @UseAuth(VerificationJWT)
    @Validator({
        orderType: Joi.required(),
        orderTypeId: Joi.number().required()
    })
    async update(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams("orderType") orderType: OrderType,
        @PathParams("orderTypeId") orderTypeId: number,
    ) {
        orderTypeId = Number(orderTypeId)
        // This will check and throw error if not exist 
        await OrderType.findOneOrThrowId(orderTypeId)
        orderType.id = orderTypeId
        await orderType.save()
        return { id: orderType.id }
    }

}
