import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';

import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { OrderFood, OrderFoodStatus } from '../../entity/OrderFood';
import { OrderFoodInsert } from '../../entity-request/OrderFoodInsert';
import { OrderFoodDetailInsert } from '../../entity-request/OrderFoodDetailInsert';
import { getThisMonthInterval, convertFullDateToInt, getFromToDate } from '../../util/helper';
import { OrderFoodService } from '../../services/OrderFoodService';

@Controller("/admin/orderFood")
@Docs("docs_admin")
export class OrderFoodController {
    constructor(
        private orderFoodService: OrderFoodService,
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
        @QueryParams('status') status: OrderFoodStatus,
        @QueryParams('areaId') areaId: number,
        @Req() req: Request,
        @Res() res: Response
    ) {
        if (req.staff.area) areaId = req.staff.area.id
        const { orderFoods, total, totalIncome, totalRevenue } = await this.orderFoodService
            .getManyAndCount({
                search, page, limit, from, to,
                status: req.query.status, storeId: null, areaId
            })

        return res.sendOK({ data: orderFoods, total, totalIncome, totalRevenue })
    }

    // =====================GET ITEM=====================
    @Get('/:orderFoodId')
    @UseAuth(VerificationJWT)
    @Validator({
        orderFoodId: Joi.number().required(),
    })
    async findOne(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @PathParams("orderFoodId") orderFoodId: number,
    ) {
        orderFoodId = Number(orderFoodId)
        let orderFood = await OrderFood.findOneOrThrowOption({
            where: { id: orderFoodId },
            relations: ['customer', 'driver', 'details', 'details.food', 'store']
        })
        return orderFood
    }


    // =====================UPDATE ITEM=====================
    @Post('/:orderFoodId/update')
    @UseAuth(VerificationJWT)
    @Validator({
        orderFood: Joi.required(),
        orderFoodId: Joi.number().required()
    })
    async update(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams("orderFood") orderFood: OrderFood,
        @PathParams("orderFoodId") orderFoodId: number,
    ) {
        orderFoodId = Number(orderFoodId)
        // This will check and throw error if not exist 
        await OrderFood.findOneOrThrowId(orderFoodId)
        orderFood.id = orderFoodId
        await orderFood.save()
        return { id: orderFood.id }
    }

}
