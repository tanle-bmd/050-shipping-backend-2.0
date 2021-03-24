import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';

import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { OrderDelivery, OrderDeliveryStatus } from '../../entity/OrderDelivery';
import { convertFullDateToInt } from '../../util/helper';
import { OrderDeliveryService } from '../../services/OrderDeliveryService';

@Controller("/admin/orderDelivery")
@Docs("docs_admin")
export class OrderDeliveryController {
    constructor(
        private orderDeliveryService: OrderDeliveryService,
    ) { }


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
        @QueryParams("from") from: Date,
        @QueryParams("to") to: Date,
        @QueryParams("search") search: string = "",
        @QueryParams('status') status: OrderDeliveryStatus,
        @QueryParams('areaId') areaId: number,
        @Req() req: Request,
        @Res() res: Response
    ) {
        if (req.staff.area) areaId = req.staff.area.id
        const {
            orderDeliveries, total, totalIncome, totalRevenue
        } = await this.orderDeliveryService
            .getManyAndCount({
                page, limit, search, from, to, status, areaId
            })

        return res.sendOK({ data: orderDeliveries, total, totalIncome, totalRevenue }, "Success")
    }

    // =====================GET ITEM=====================
    @Get('/:orderDeliveryId')
    @UseAuth(VerificationJWT)
    @Validator({
        orderDeliveryId: Joi.number().required(),
    })
    async findOne(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @PathParams("orderDeliveryId") orderDeliveryId: number,
    ) {
        let where = `orderDelivery.id = orderDeliveryId`
        let orderDelivery = await OrderDelivery.createQueryBuilder('orderDelivery')
            .leftJoinAndSelect('orderDelivery.customer', 'customer')
            .leftJoinAndSelect('orderDelivery.driver', 'driver')
            .leftJoinAndSelect('orderDelivery.details', 'details')
            .where(where)
            .getOne()

        return orderDelivery
    }


    // =====================UPDATE ITEM=====================
    @Post('/:orderDeliveryId/update')
    @UseAuth(VerificationJWT)
    @Validator({
        orderDelivery: Joi.required(),
        orderDeliveryId: Joi.number().required()
    })
    async update(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams("orderDelivery") orderDelivery: OrderDelivery,
        @PathParams("orderDeliveryId") orderDeliveryId: number,
    ) {
        orderDeliveryId = Number(orderDeliveryId)
        // This will check and throw error if not exist 
        await OrderDelivery.findOneOrThrowId(orderDeliveryId)
        orderDelivery.id = orderDeliveryId
        await orderDelivery.save()
        return { id: orderDelivery.id }
    }

}
