import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';

import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { OrderTransport, OrderTransportStatus } from '../../entity/OrderTransport';
import { convertFullDateToInt } from '../../util/helper';
import { OrderTransportService } from '../../services/OrderTransportService';

@Controller("/admin/orderTransport")
@Docs("docs_admin")
export class OrderTransportController {
    constructor(
        private orderTransportService: OrderTransportService,
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
        @QueryParams('status') status: OrderTransportStatus,
        @QueryParams('areaId') areaId: number,
        @Req() req: Request,
        @Res() res: Response
    ) {
        if (req.staff.area) areaId = req.staff.area.id
        const {
            orderTransports, total, totalIncome, totalRevenue
        } = await this.orderTransportService
            .getManyAndCount({
                page, limit, search, from, to, status, areaId
            })

        return res.sendOK({ data: orderTransports, total, totalIncome, totalRevenue }, "Success")
    }

    // =====================GET ITEM=====================
    @Get('/:orderTransportId')
    @UseAuth(VerificationJWT)
    @Validator({
        orderTransportId: Joi.number().required(),
    })
    async findOne(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @PathParams("orderTransportId") orderTransportId: number,

    ) {
        orderTransportId = Number(orderTransportId)
        let orderTransport = await OrderTransport.findOneOrThrowId(orderTransportId)
        return orderTransport
    }


    // =====================UPDATE ITEM=====================
    @Post('/:orderTransportId/update')
    @UseAuth(VerificationJWT)
    @Validator({
        orderTransport: Joi.required(),
        orderTransportId: Joi.number().required()
    })
    async update(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams("orderTransport") orderTransport: OrderTransport,
        @PathParams("orderTransportId") orderTransportId: number,
    ) {
        orderTransportId = Number(orderTransportId)
        // This will check and throw error if not exist 
        await OrderTransport.findOneOrThrowId(orderTransportId)
        orderTransport.id = orderTransportId
        await orderTransport.save()
        return { id: orderTransport.id }
    }

}
