import { Controller, UseAuth, Req, Get, Res, Response, HeaderParams, PathParams, Post, BodyParams, QueryParams } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import { Request } from 'express';
import Joi from '@hapi/joi';

import { Validator } from '../../middleware/validator/Validator';
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { OrderTransport, OrderTransportStatus } from '../../entity/OrderTransport';
import { TransactionService } from '../../services/TransactionService';
import { OrderService } from '../../services/OrderService';
import { formatVND } from '../../util/helper';
import { ExpoTokenService } from '../../services/ExpoTokenService';
import { OrderTransportService } from '../../services/OrderTransportService';
import { ConfigCommissionService } from '../../services/ConfigCommissionService';
import { ConfigCommissionType } from '../../entity/ConfigCommission';

@Controller("/driver/orderTransport")
@Docs("docs_driver")
export class OrderTransportController {
    constructor(
        private configCommissionService: ConfigCommissionService,
        private orderTransportService: OrderTransportService,
        private orderService: OrderService,
        private transactionService: TransactionService,
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
        const orders = await OrderTransport.find({
            skip: (page - 1) * limit,
            take: limit,
            where: {
                status: OrderTransportStatus.waiting
            },
            order: { id: 'ASC' }
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
        const order = await OrderTransport.find({
            where: {
                status: OrderTransportStatus.delivering,
                driver: req.driver
            }
        })
        return res.sendOK(order)
    }


    // =====================GET ITEM=====================
    @Get('/:orderTransportId')
    @UseAuth(VerificationJWT)
    @Validator({})
    async findOne(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @PathParams('orderTransportId') orderTransportId: number
    ) {
        const order = await OrderTransport.findOneOrThrowId(orderTransportId, {
            relations: ['customer']
        })
        return order
    }


    // =====================ACCEPT ORDER=====================
    @Post('/:orderTransportId/accept')
    @UseAuth(VerificationJWT)
    @Validator({})
    async acceptOrder(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @PathParams('orderTransportId') orderTransportId: number
    ) {
        // Check available
        const order = await OrderTransport.findOneOrThrowId(orderTransportId, { relations: ['customer'] })
        if (order.status != OrderTransportStatus.waiting) {
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

        order.status = OrderTransportStatus.delivering
        order.driver = req.driver
        await order.save()

        // Push notification
        this.expoTokenService.sendNotificationCustomerOrderTransport(order)

        return order
    }


    // =====================UPDATE STATUS=====================
    @Post('/:orderTransportId/status')
    @UseAuth(VerificationJWT)
    @Validator({})
    async updateStatus(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams('status') status: OrderTransportStatus,
        @PathParams('orderTransportId') orderTransportId: number
    ) {
        const order = await OrderTransport.findOneOrThrowId(orderTransportId, { relations: ['driver', 'customer'] })
        if (order.status == OrderTransportStatus.complete) {
            return res.sendClientError('????n h??ng n??y ???? ho??n th??nh. Kh??ng th??? thay ?????i tr???ng th??i!')
        }

        if (order.driver && order.driver.id != req.driver.id) {
            return res.sendClientError('B???n kh??ng th??? thay ?????i tr???ng th??i ????n h??ng c???a ng?????i kh??c!')
        }
        if (status == OrderTransportStatus.complete) {
            await this.transactionService.handleTransactionOrder(order)
        }
        order.status = status
        await order.save()

        // Push notification
        this.expoTokenService.sendNotificationCustomerOrderTransport(order)

        return order
    }


    // =====================UPDATE MONEY=====================
    @Post('/:orderTransportId/money')
    @UseAuth(VerificationJWT)
    @Validator({
        money: Joi.number().min(0).required()
    })
    async updatePrice(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams('money') money: number,
        @PathParams('orderTransportId') orderTransportId: number
    ) {
        const order = await OrderTransport.findOneOrThrowId(orderTransportId, { relations: ['area', 'driver', 'customer'] })
        const configCommission = await this.configCommissionService.getConfig(order.area.id, ConfigCommissionType.Transport)
        await this.orderTransportService.updateMoney(order, money, configCommission)

        return order
    }
}
