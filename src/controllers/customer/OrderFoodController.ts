import { Controller, UseAuth, Req, Get, Res, Response, HeaderParams, PathParams, Post, BodyParams, QueryParams } from '@tsed/common';
import Joi from '@hapi/joi';
import { Docs } from '@tsed/swagger';
import { Request } from 'express';

import { Validator } from '../../middleware/validator/Validator';
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { OrderFood, OrderFoodStatus } from '../../entity/OrderFood';
import { OrderFoodService } from '../../services/OrderFoodService';
import { OrderFoodDetail } from '../../entity/OrderFoodDetail';
import { OrderFoodDetailInsert } from '../../entity-request/OrderFoodDetailInsert';
import { OrderFoodInsert } from '../../entity-request/OrderFoodInsert';
import { Store } from '../../entity/Store';
import { ExpoTokenService } from '../../services/ExpoTokenService';
import { ConfigCommissionType } from '../../entity/ConfigCommission';
import { ConfigOrderType } from '../../entity/ConfigOrder';
import { ConfigCommissionService } from '../../services/ConfigCommissionService';
import { ConfigOrderService } from '../../services/ConfigOrderService';

@Controller("/customer/orderFood")
@Docs("docs_customer")
export class OrderFoodController {
    constructor(
        private configCommissionService: ConfigCommissionService,
        private configOrderService: ConfigOrderService,
        private orderFoodService: OrderFoodService,
        private expoTokenService: ExpoTokenService
    ) { }

    // =====================ESTIMATE=====================
    @Post('/estimate')
    @UseAuth(VerificationJWT)
    @Validator({
        storeId: Joi.number().required(),
        order: Joi.required(),
        orderDetails: Joi.required()
    })
    async createEstimate(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams("order") order: OrderFoodInsert,
        @BodyParams("storeId") storeId: number,
        @BodyParams("orderDetails", OrderFoodDetailInsert) orderDetails: OrderFoodDetailInsert[],
    ) {
        const newOrder = order.toOrderFood(req.customer)
        // Handle details
        if (orderDetails && orderDetails.length) {
            const details = await Promise.all(
                orderDetails.map(async detail => await detail.toOrderFoodDetail())
            )
            // Save details
            newOrder.details = details
            await OrderFoodDetail.save(details)
        }

        // Handle and save order
        const store = await Store.findOneOrThrowId(storeId)
        newOrder.store = store
        newOrder.generateCode()
        const configOrder = await this.configOrderService.getConfig(req.customer.area.id, ConfigOrderType.Food)
        const configCommission = await this.configCommissionService.getConfig(req.customer.area.id, ConfigCommissionType.Food)
        await newOrder.calculateMoney(configOrder, configCommission)
        return res.sendOK(newOrder)
    }

    // =====================CREATE ITEM=====================
    @Post('')
    @UseAuth(VerificationJWT)
    @Validator({
        storeId: Joi.number().required(),
        order: Joi.required(),
        orderDetails: Joi.required()
    })
    async create(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @HeaderParams("version") version: string,
        @BodyParams("order") order: OrderFoodInsert,
        @BodyParams("storeId") storeId: number,
        @BodyParams("orderDetails", OrderFoodDetailInsert) orderDetails: OrderFoodDetailInsert[],
    ) {
        const orderNotComplete = await this.orderFoodService.getTotalNotComplete(req.customer.id)
        if (orderNotComplete >= 2)
            return res.sendClientError('Bạn chỉ có thể đặt đồng thời 2 đơn mua thức ăn cùng lúc.')

        if (!orderDetails || !orderDetails.length)
            return res.sendClientError('Vui lòng chọn món ăn.')

        const newOrder = order.toOrderFood(req.customer)

        if (!newOrder.startAddress) {
            return res.sendClientError('Vui lòng nhập địa chỉ nhận hàng')
        }

        if (!newOrder.phone) {
            return res.sendClientError('Vui lòng nhập số điện thoại')
        }
        // Handle details
        const details = await Promise.all(
            orderDetails.map(async detail => await detail.toOrderFoodDetail())
        )
        // Save details
        newOrder.details = details
        await OrderFoodDetail.save(details)

        // Handle and save order
        const store = await Store.findOneOrThrowId(storeId)
        newOrder.store = store
        newOrder.generateCode()

        const configOrder = await this.configOrderService.getConfig(req.customer.area.id, ConfigOrderType.Food)
        const configCommission = await this.configCommissionService.getConfig(req.customer.area.id, ConfigCommissionType.Food)
        await newOrder.calculateMoney(configOrder, configCommission)

        newOrder.area = req.customer.area
        await newOrder.save()

        // Push notification
        this.expoTokenService.sentNotificationOrderFood(newOrder)

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
        AND orderFood.status <> '${OrderFoodStatus.cancel}'`
        let [orders, total] = await OrderFood.createQueryBuilder('orderFood')
            .leftJoinAndSelect('orderFood.driver', 'driver')
            .leftJoinAndSelect('orderFood.details', 'details')
            .leftJoinAndSelect('details.food', 'food')
            .leftJoinAndSelect('orderFood.customer', 'customer')
            .leftJoinAndSelect('orderFood.store', 'store')
            .where(where)
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('orderFood.id', 'DESC')
            .getManyAndCount()

        return res.sendOK({ data: orders, total }, "Success")
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
        @PathParams("orderFoodId") orderFoodId: number
    ) {
        orderFoodId = Number(orderFoodId)
        let orderFood = await OrderFood.findOneOrThrowId(orderFoodId, { relations: ['details', 'driver'] })
        return orderFood
    }

    // =====================CANCEL ITEM=====================
    @Post('/:orderFoodId/cancel')
    @UseAuth(VerificationJWT)
    @Validator({
        orderFoodId: Joi.number().required(),
    })
    async cancelOrder(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @HeaderParams("version") version: string,
        @PathParams("orderFoodId") orderFoodId: number
    ) {
        orderFoodId = Number(orderFoodId)
        let orderFood = await OrderFood.findOneOrThrowId(orderFoodId)
        if (orderFood.status == OrderFoodStatus.delivering) {
            return res.sendClientError('Đơn hàng này đã được tài xế nhận nên không thể huỷ.')
        }
        if (orderFood.status == OrderFoodStatus.complete) {
            return res.sendClientError('Đơn hàng này đã được hoàn thành nên không thể huỷ.')
        }
        orderFood.status = OrderFoodStatus.cancel
        await orderFood.save()
        return orderFood
    }


    // =====================DONE ITEM=====================
    @Post('/:orderFoodId/done')
    @UseAuth(VerificationJWT)
    @Validator({
        orderFoodId: Joi.number().required(),
    })
    async doneOrder(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @PathParams("orderFoodId") orderFoodId: number
    ) {
        orderFoodId = Number(orderFoodId)
        let orderFood = await OrderFood.findOneOrThrowId(orderFoodId)

        if (orderFood.status != OrderFoodStatus.complete) {
            return res.sendClientError('Vui lòng chờ tài xế hoàn thành đơn hàng.')
        }
        orderFood.status = OrderFoodStatus.done
        await orderFood.save()
        return orderFood
    }
}
