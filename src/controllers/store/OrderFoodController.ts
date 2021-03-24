// IMPORT LIBRARY
import { Controller, UseAuth, Req, Get, Res, Response, HeaderParams, PathParams, QueryParams } from '@tsed/common';
import Joi from '@hapi/joi';
import { Docs } from '@tsed/swagger';
import { Request } from 'express';


// IMPORT CUSTOM
import { Validator } from '../../middleware/validator/Validator';
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { OrderFood, OrderFoodStatus } from '../../entity/OrderFood';
import { OrderFoodService } from '../../services/OrderFoodService';


@Controller("/store/orderFood")
@Docs("docs_store")
export class OrderFoodController {
    constructor(
        private orderFoodService: OrderFoodService,) { }


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
        @Req() req: Request,
        @Res() res: Response
    ) {
        const { orderFoods, total, totalIncome, totalRevenue, totalMoneyTotal } = await this.orderFoodService
            .getManyAndCount({
                search, page, limit, from, to, status: req.query.status, storeId: req.store.id, areaId: null
            })

        return res.sendOK({ data: orderFoods, total, totalIncome, totalRevenue, totalMoneyTotal })
    }

} // END FILE
