import { Controller, UseAuth, Req, Get, Res, Response, HeaderParams, PathParams, QueryParams } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import { Request } from 'express';

import { Validator } from '../../middleware/validator/Validator';
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Notification } from '../../entity/Notification';
import { NotificationService } from '../../services/NotificationService';

@Controller("/customer/notification")
@Docs("docs_customer")
export class NotificationController {
    constructor(private notificationService: NotificationService) { }

    @Get('')
    @UseAuth(VerificationJWT)
    @Validator({})
    async findAll(
        @Req() req: Request,
        @Res() res: Response,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 0,
        @HeaderParams("token") token: string,
    ) {
        let where = `notification.isBlock = false`

        if (req.customer.area) {
            where += ` AND area.id = ${req.customer.area.id} OR area.id IS NULL`
        }

        const [notifications, total] = await Notification.createQueryBuilder('notification')
            .leftJoinAndSelect('notification.area', 'area')
            .where(where)
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('notification.id', 'DESC')
            .getManyAndCount()

        return res.sendOK({ notifications, total })
    }
}
