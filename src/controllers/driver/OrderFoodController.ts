import { Controller, UseAuth, Req, Get, Res, Response, HeaderParams, PathParams, BodyParams, Post, QueryParams } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import { Request } from 'express';

import { Validator } from '../../middleware/validator/Validator';
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { OrderFood, OrderFoodStatus } from '../../entity/OrderFood';
import { TransactionService } from '../../services/TransactionService';
import { OrderService } from '../../services/OrderService';
import { formatVND } from '../../util/helper';
import { pushNotification } from '../../util/expo';
import { ExpoTokenService } from '../../services/ExpoTokenService';

@Controller("/driver/orderFood")
@Docs("docs_driver")
export class OrderFoodController {
    constructor(
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
        const orders = await OrderFood.find({
            skip: (page - 1) * limit,
            take: limit,
            where: {
                status: OrderFoodStatus.waiting
            },
            order: { id: 'ASC' },
            relations: ['details', 'details.food', 'store']
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
        const order = await OrderFood.find({
            where: {
                status: OrderFoodStatus.delivering,
                driver: req.driver
            },
            relations: ['details', 'details.food', 'store']
        })
        return res.sendOK(order)
    }

    // =====================GET ITEM=====================
    @Get('/:orderFoodId')
    @UseAuth(VerificationJWT)
    @Validator({})
    async findOne(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @PathParams('orderFoodId') orderFoodId: number
    ) {
        const order = await OrderFood.findOneOrThrowId(orderFoodId, {
            relations: ['details', 'customer']
        })
        return order
    }

    // =====================ACCEPT ORDER=====================
    @Post('/:orderFoodId/accept')
    @UseAuth(VerificationJWT)
    @Validator({})
    async acceptOrder(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @PathParams('orderFoodId') orderFoodId: number
    ) {
        const order = await OrderFood.findOneOrThrowOption({
            where: { id: orderFoodId },
            relations: ['customer', 'store', 'details', 'details.food']
        })

        // Check if order not available
        if (order.status != OrderFoodStatus.waiting) {
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

        order.status = OrderFoodStatus.delivering
        order.driver = req.driver
        await order.save()

        // Push notification
        this.expoTokenService.sendNotificationCustomerOrderFood(order)

        return order
    }

    // =====================UPDATE STATUS=====================
    @Post('/:orderFoodId/status')
    @UseAuth(VerificationJWT)
    @Validator({})
    async updateStatus(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams('status') status: OrderFoodStatus,
        @PathParams('orderFoodId') orderFoodId: number
    ) {
        const order = await OrderFood.findOneOrThrowId(orderFoodId, {
            relations: ['driver', 'customer', 'store', 'details', 'details.food']
        })
        if (order.status == OrderFoodStatus.complete) {
            return res.sendClientError('????n h??ng n??y ???? ho??n th??nh. Kh??ng th??? thay ?????i tr???ng th??i!')
        }

        if (order.driver && order.driver.id != req.driver.id) {
            return res.sendClientError('B???n kh??ng th??? thay ?????i tr???ng th??i ????n h??ng c???a ng?????i kh??c!')
        }

        if (status == OrderFoodStatus.complete) {
            await this.transactionService.handleTransactionOrder(order)
        }
        order.status = status
        await order.save()

        // Push notification
        this.expoTokenService.sendNotificationCustomerOrderFood(order)

        return order
    }
}
