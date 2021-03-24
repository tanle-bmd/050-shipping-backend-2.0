import { Controller, UseAuth, Req, Get, Res, Response, HeaderParams, PathParams, Post, BodyParams, QueryParams } from '@tsed/common';
import Joi from '@hapi/joi';
import { Docs } from '@tsed/swagger';
import { Request } from 'express';
import { Exception } from 'ts-httpexceptions';

import { Validator } from '../../middleware/validator/Validator';
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { OrderDelivery, OrderDeliveryStatus, OrderDeliveryType } from '../../entity/OrderDelivery';
import { OrderDeliveryService } from '../../services/OrderDeliveryService';
import { OrderDeliveryDetail } from '../../entity/OrderDeliveryDetail';
import { OrderDeliveryInsert } from '../../entity-request/OrderDeliveryInsert';
import { getCurrentTimeInt } from '../../util/helper';
import { ExpoTokenService } from '../../services/ExpoTokenService';
import { ConfigOrderService } from '../../services/ConfigOrderService';
import { ConfigOrderType } from '../../entity/ConfigOrder';
import { ConfigCommissionType } from '../../entity/ConfigCommission';
import { ConfigCommissionService } from '../../services/ConfigCommissionService';

@Controller("/customer/orderDelivery")
@Docs("docs_customer")
export class OrderDeliveryController {
    constructor(
        private configCommissionService: ConfigCommissionService,
        private configOrderService: ConfigOrderService,
        private orderDeliveryService: OrderDeliveryService,
        private expoTokenService: ExpoTokenService,
    ) { }

    // =====================ESTIMATE=====================
    @Post('/estimate')
    @UseAuth(VerificationJWT)
    @Validator({})
    async createEstimate(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams("order") order: OrderDeliveryInsert,
        @BodyParams("orderDetails", OrderDeliveryDetail) orderDetails: OrderDeliveryDetail[],
    ) {
        const newOrder = order.toOrderDeliver(req.customer)
        // Save details
        if (orderDetails && orderDetails.length) {
            orderDetails.forEach(order => {
                order.dateCreated = getCurrentTimeInt()
                order.dateUpdated = getCurrentTimeInt()
            })
            newOrder.details = orderDetails
            await OrderDeliveryDetail.save(orderDetails)
        }

        // Handle and save order
        const configOrder = await this.configOrderService.getConfig(req.customer.area.id, ConfigOrderType.Delivery)
        const configCommission = await this.configCommissionService.getConfig(req.customer.area.id, ConfigCommissionType.Delivery)

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
        @BodyParams("order") order: OrderDeliveryInsert,
        @BodyParams("orderDetails", OrderDeliveryDetail) orderDetails: OrderDeliveryDetail[],
    ) {
        const orderNotComplete = await this.orderDeliveryService.getTotalNotComplete(req.customer.id)
        if (orderNotComplete >= 2)
            return res.sendClientError('Bạn chỉ có thể đặt đồng thời 2 đơn giao hàng cùng lúc.')

        const newOrder = order.toOrderDeliver(req.customer)
        if (!newOrder.startAddress || !newOrder.endAddress) {
            throw new Exception(400, 'Hệ thống đang trong quá trình nâng cấp. Vui lòng đợi năng cấp')
        }

        // Save details
        if (orderDetails && orderDetails.length) {
            orderDetails.forEach(order => {
                order.dateCreated = getCurrentTimeInt()
                order.dateUpdated = getCurrentTimeInt()
            })
            newOrder.details = orderDetails
            await OrderDeliveryDetail.save(orderDetails)
        }

        // Handle and save order
        newOrder.generateCode()
        const configOrder = await this.configOrderService.getConfig(req.customer.area.id, ConfigOrderType.Delivery)
        const configCommission = await this.configCommissionService.getConfig(req.customer.area.id, ConfigCommissionType.Delivery)

        await newOrder.calculateMoney(configOrder, configCommission)

        newOrder.area = req.customer.area
        console.log('req.customer.area:', req.customer.area)
        await newOrder.save()

        // Push notification
        this.expoTokenService.sentNotificationOrderDelivery(newOrder)

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
        @BodyParams("order") order: OrderDeliveryInsert
    ) {
        const newOrder = order.toOrderDeliver(req.customer)
        if (!newOrder.startAddress) {
            throw new Exception(400, 'Vui lòng nhập địa chỉ giao hàng')
        }

        // Handle and save order
        newOrder.generateCode()
        newOrder.type = OrderDeliveryType.Simple
        newOrder.area = req.customer.area
        await newOrder.save()

        // Push notification
        this.expoTokenService.sentNotificationOrderDelivery(newOrder)

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
        AND orderDelivery.status <> '${OrderDeliveryStatus.cancel}'`
        let [orders, total] = await OrderDelivery.createQueryBuilder('orderDelivery')
            .leftJoinAndSelect('orderDelivery.driver', 'driver')
            .leftJoinAndSelect('orderDelivery.details', 'details')
            .leftJoinAndSelect('orderDelivery.customer', 'customer')
            .where(where)
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('orderDelivery.id', 'DESC')
            .getManyAndCount()

        return res.sendOK({ data: orders, total }, "Success")
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
        @PathParams("orderDeliveryId") orderDeliveryId: number
    ) {
        let orderFood = await OrderDelivery.findOneOrThrowId(orderDeliveryId, { relations: ['details', 'driver'] })
        return orderFood
    }

    // =====================CANCEL ITEM=====================
    @Post('/:orderDeliveryId/cancel')
    @UseAuth(VerificationJWT)
    @Validator({
        orderDeliveryId: Joi.number().required(),
    })
    async cancelOrder(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @PathParams("orderDeliveryId") orderDeliveryId: number
    ) {
        orderDeliveryId = Number(orderDeliveryId)
        let orderDelivery = await OrderDelivery.findOneOrThrowId(orderDeliveryId)
        if (orderDelivery.status == OrderDeliveryStatus.delivering) {
            return res.sendClientError('Đơn hàng này đã được tài xế nhận nên không thể huỷ.')
        }
        if (orderDelivery.status == OrderDeliveryStatus.complete) {
            return res.sendClientError('Đơn hàng này đã được hoàn thành nên không thể huỷ.')
        }
        orderDelivery.status = OrderDeliveryStatus.cancel
        await orderDelivery.save()
        return orderDelivery
    }

} // END FILE
