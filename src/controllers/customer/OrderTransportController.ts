import { Controller, UseAuth, Req, Get, Res, Response, HeaderParams, PathParams, Post, BodyParams, QueryParams } from '@tsed/common';
import Joi from '@hapi/joi';
import { Docs } from '@tsed/swagger';
import { Request } from 'express';

import { Validator } from '../../middleware/validator/Validator';
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { OrderTransport, OrderTransportStatus, OrderTransportType } from '../../entity/OrderTransport';
import { OrderTransportService } from '../../services/OrderTransportService';
import { OrderTransportInsert } from '../../entity-request/OrderTransportInsert';
import { ExpoTokenService } from '../../services/ExpoTokenService';
import { Exception } from 'ts-httpexceptions';
import { ConfigCommissionType } from '../../entity/ConfigCommission';
import { ConfigOrderType } from '../../entity/ConfigOrder';
import { ConfigCommissionService } from '../../services/ConfigCommissionService';
import { ConfigOrderService } from '../../services/ConfigOrderService';

@Controller("/customer/orderTransport")
@Docs("docs_customer")
export class OrderTransportController {
    constructor(
        private configCommissionService: ConfigCommissionService,
        private configOrderService: ConfigOrderService,
        private orderTransportService: OrderTransportService,
        private expoTokenService: ExpoTokenService,
    ) { }

    // =====================ESTIMATE=====================
    @Post('/estimate')
    @UseAuth(VerificationJWT)
    @Validator({})
    async estimate(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams("order") order: OrderTransportInsert,
    ) {
        const newOrder = order.toOrderTransport(req.customer)
        newOrder.generateCode()

        // Handle and save order
        const configOrder = await this.configOrderService.getConfig(req.customer.area.id, ConfigOrderType.Transport)
        const configCommission = await this.configCommissionService.getConfig(req.customer.area.id, ConfigCommissionType.Transport)
        await newOrder.calculateMoney(configOrder, configCommission)

        return newOrder
    }


    // =====================CREATE ITEM=====================
    @Post('')
    @UseAuth(VerificationJWT)
    @Validator({})
    async create(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams("order") order: OrderTransportInsert,
    ) {
        const orderNotComplete = await this.orderTransportService.getTotalNotComplete(req.customer.id)
        if (orderNotComplete >= 2)
            return res.sendClientError('B???n ch??? c?? th??? ?????t ?????ng th???i 2 chuy???n xe ??m c??ng l??c.')

        const newOrder = order.toOrderTransport(req.customer)
        newOrder.generateCode()

        if (!newOrder.startAddress || !newOrder.endAddress) {
            throw new Exception(400, 'Kh??ng t??m th???y ?????a ch???')
        }

        // Handle and save order
        const configOrder = await this.configOrderService.getConfig(req.customer.area.id, ConfigOrderType.Transport)
        const configCommission = await this.configCommissionService.getConfig(req.customer.area.id, ConfigCommissionType.Transport)
        await newOrder.calculateMoney(configOrder, configCommission)

        newOrder.area = req.customer.area
        await newOrder.save()

        // Push notification
        this.expoTokenService.sentNotificationOrderTransport(newOrder)

        res.sendOK(newOrder)
    }


    // =====================CREATE ITEM=====================
    @Post('/simple')
    @UseAuth(VerificationJWT)
    @Validator({})
    async createSimple(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams("order") order: OrderTransportInsert,
    ) {
        const statusComplete = [OrderTransportStatus.complete, OrderTransportStatus.cancel, OrderTransportStatus.noDelivery]
        let where = `orderTransport.status NOT  IN (:...statusComplete) `
        const orderNotComplete = await OrderTransport.createQueryBuilder('orderTransport')
            .where(where, { statusComplete })
            .orderBy('orderTransport.id', 'DESC')
            .getCount()

        if (orderNotComplete >= 2)
            return res.sendClientError('B???n ch??? c?? th??? ?????t ?????ng th???i 2 chuy???n xe ??m c??ng l??c.')

        const newOrder = order.toOrderTransport(req.customer)

        if (!newOrder.startAddress || !newOrder.endAddress) {
            throw new Exception(400, 'Vui l??ng nh???p ?????a ch??? ?????n v?? ?????a ch??? ????n.')
        }

        // Handle and save order
        newOrder.generateCode()
        newOrder.type = OrderTransportType.Simple
        newOrder.area = req.customer.area
        await newOrder.save()

        // Push notification
        this.expoTokenService.sentNotificationOrderTransport(newOrder)

        res.sendOK(newOrder)
    }


    // =====================GET LIST=====================
    @Get('')
    @UseAuth(VerificationJWT)
    @Validator({
        page: Joi.number().min(0),
        limit: Joi.number().min(0)
    })
    async findAll(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 0
    ) {
        let where = `customer.id = ${req.customer.id} 
        AND orderTransport.status <> '${OrderTransportStatus.cancel}'`
        let [orders, total] = await OrderTransport.createQueryBuilder('orderTransport')
            .leftJoinAndSelect('orderTransport.driver', 'driver')
            .leftJoinAndSelect('orderTransport.customer', 'customer')
            .where(where)
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('orderTransport.id', 'DESC')
            .getManyAndCount()

        return res.sendOK({ data: orders, total }, "Success")
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
        @PathParams("orderTransportId") orderTransportId: number
    ) {
        orderTransportId = Number(orderTransportId)
        let orderTransport = await OrderTransport.findOneOrThrowId(orderTransportId, { relations: ['driver'] })
        return orderTransport
    }

    // =====================CANCEL ITEM=====================
    @Post('/:orderTransportId/cancel')
    @UseAuth(VerificationJWT)
    @Validator({
        orderTransportId: Joi.number().required(),
    })
    async cancelOrder(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @PathParams("orderTransportId") orderTransportId: number
    ) {
        // throw new Exception(500, 'D???ch v??? ?????t Xe ??ang ???????c n??ng c???p, c???p nh???t. Vui l??ng ?????t l???i sau v??i ng??y n???a !')

        orderTransportId = Number(orderTransportId)
        let orderTransport = await OrderTransport.findOneOrThrowId(orderTransportId)
        if (orderTransport.status == OrderTransportStatus.delivering) {
            return res.sendClientError('Cu???c xe ??m n??y ???? ???????c t??i x??? nh???n n??n kh??ng th??? hu???.')
        }
        if (orderTransport.status == OrderTransportStatus.complete) {
            return res.sendClientError('Cu???c xe ??m n??y ???? ???????c ho??n th??nh n??n kh??ng th??? hu???.')
        }
        orderTransport.status = OrderTransportStatus.cancel
        await orderTransport.save()
        return orderTransport
    }
}
