import { Controller, UseAuth, Req, Get, Res, Response, HeaderParams, PathParams, Post, BodyParams, QueryParams } from '@tsed/common';
import Joi from '@hapi/joi';
import { Docs } from '@tsed/swagger';
import { Request } from 'express';

import { Validator } from '../../middleware/validator/Validator';
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { OrderDelivery, OrderDeliveryStatus } from '../../entity/OrderDelivery';
import { TransactionService } from '../../services/TransactionService';
import { OrderService } from '../../services/OrderService';
import { formatVND } from '../../util/helper';
import { ExpoTokenService } from '../../services/ExpoTokenService';
import { OrderDeliveryService } from '../../services/OrderDeliveryService';
import { ConfigCommissionService } from '../../services/ConfigCommissionService';
import { ConfigCommissionType } from '../../entity/ConfigCommission';

@Controller("/driver/orderDelivery")
@Docs("docs_driver")
export class OrderDeliveryController {
    constructor(
        private configCommissionService: ConfigCommissionService,
        private orderDeliveryService: OrderDeliveryService,
        private transactionService: TransactionService,
        private orderService: OrderService,
        private expoTokenService: ExpoTokenService
    ) { }

    // =====================GET LIST WAITING=====================
    @Get('/waiting')
    @UseAuth(VerificationJWT)
    @Validator({})
    async findAll(
        @Req() req: Request,
        @Res() res: Response,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 0,
        @HeaderParams("token") token: string,
    ) {
        const orders = await OrderDelivery.find({
            skip: (page - 1) * limit,
            take: limit,
            where: {
                status: OrderDeliveryStatus.waiting
            },
            order: { id: 'ASC' },
            relations: ['details', 'customer']
        })
        return res.sendOK(orders)
    }


    // =====================GET DELIVERING=====================
    @Get('/delivering')
    @UseAuth(VerificationJWT)
    @Validator({})
    async findDelivering(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
    ) {
        const order = await OrderDelivery.find({
            where: {
                status: OrderDeliveryStatus.delivering,
                driver: req.driver
            },
            relations: ['details', 'customer']
        })
        return res.sendOK(order)
    }


    // =====================GET ITEM=====================
    @Get('/:orderDeliveryId')
    @UseAuth(VerificationJWT)
    @Validator({})
    async findOne(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @PathParams('orderDeliveryId') orderDeliveryId: number
    ) {
        const order = await OrderDelivery.findOneOrThrowId(orderDeliveryId, {
            relations: ['customer', 'details']
        })
        return res.sendOK(order)
    }


    // =====================ACCEPT ORDER=====================
    @Post('/:orderDeliveryId/accept')
    @UseAuth(VerificationJWT)
    @Validator({})
    async acceptOrder(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @PathParams('orderDeliveryId') orderDeliveryId: number
    ) {
        // Check available
        const order = await OrderDelivery.findOneOrThrowId(orderDeliveryId, { relations: ['customer'] })
        if (order.status != OrderDeliveryStatus.waiting) {
            return res.sendClientError('????n h??ng n??y ???? ???????c nh???n ho???c hu???. Vui l??ng l???a ch???n ????n h??ng kh??c!')
        }

        // Validate
        // if (req.driver.balance < 20000) {
        //     return res.sendClientError('T??i kho???n c???a b???n c???n t???i thi???u 20.000?? ????? nh???n ????n h??ng. Vui l??ng n???p th??m ti???n v??o t??i kho???n.')
        // }

        const minBalance = 20 / 100 * order.moneyDistance
        if (req.driver.balance < minBalance) {
            return res.sendClientError(`T??i kho???n c???a b???n c???n t???i thi???u ${formatVND(minBalance)}?? ????? nh???n ????n h??ng n??y! Vui l??ng n???p th??m ti???n v??o t??i kho???n.`)
        }
        if (await this.orderService.isDelivering(req.driver)) {
            return res.sendClientError('Vui l??ng ho??n th??nh ????n h??ng hi???n t???i ????? nh???n ????n h??ng kh??c.')
        }

        order.status = OrderDeliveryStatus.delivering
        order.driver = req.driver
        await order.save()

        // Push notification
        this.expoTokenService.sendNotificationCustomerOrderDelivery(order)

        return order
    }


    // =====================UPDATE STATUS=====================
    @Post('/:orderDeliveryId/status')
    @UseAuth(VerificationJWT)
    @Validator({})
    async updateStatus(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams('status') status: OrderDeliveryStatus,
        @PathParams('orderDeliveryId') orderDeliveryId: number
    ) {
        const order = await OrderDelivery.findOneOrThrowId(orderDeliveryId, { relations: ['driver', 'customer'] })
        if (order.status == OrderDeliveryStatus.complete) {
            return res.sendClientError('????n h??ng n??y ???? ho??n th??nh. Kh??ng th??? thay ?????i tr???ng th??i!')
        }

        if (order.driver && order.driver.id != req.driver.id) {
            return res.sendClientError('B???n kh??ng th??? thay ?????i tr???ng th??i ????n h??ng c???a ng?????i kh??c!')
        }

        if (status == OrderDeliveryStatus.complete) {
            await this.transactionService.handleTransactionOrder(order)
        }
        order.status = status
        await order.save()

        // Push notification
        this.expoTokenService.sendNotificationCustomerOrderDelivery(order)

        return order
    }


    // =====================UPDATE MONEY=====================
    @Post('/:orderDeliveryId/money')
    @UseAuth(VerificationJWT)
    @Validator({
        money: Joi.number().min(0).required()
    })
    async updatePrice(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams('money') money: number,
        @PathParams('orderDeliveryId') orderDeliveryId: number
    ) {
        const order = await OrderDelivery.findOneOrThrowId(orderDeliveryId, { relations: ['area', 'driver', 'customer'] })
        console.log('order:', order.area)
        const configCommission = await this.configCommissionService.getConfig(order.area.id, ConfigCommissionType.Delivery)
        await this.orderDeliveryService.updateMoney(order, money, configCommission)

        return order
    }
}
