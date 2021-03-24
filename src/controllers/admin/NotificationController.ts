import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';
import { Like, Raw } from 'typeorm';

import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { Notification } from '../../entity/Notification';
import { ExpoTokenService } from '../../services/ExpoTokenService';

@Controller("/admin/notification")
@Docs("docs_admin")
export class NotificationController {
    constructor(
        private expoTokenService: ExpoTokenService,
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
        @QueryParams("page") page: number,
        @QueryParams("limit") limit: number,
        @QueryParams("isBlock") isBlock: boolean,
        @QueryParams("search") search: string = "",
        @QueryParams('areaId') areaId: number,
        @Req() req: Request,
        @Res() res: Response
    ) {
        if (req.staff.area) areaId = req.staff.area.id

        let where = `notification.title LIKE '%${search}%'`

        if (areaId) {
            where += ` AND area.id = ${areaId}`
        }

        let [notification, total] = await Notification.createQueryBuilder('notification')
            .leftJoinAndSelect('notification.area', 'area')
            .where(where)
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('notification.id', 'DESC')
            .getManyAndCount()

        return res.sendOK({ data: notification, total }, "Success")
    }


    // =====================GET ITEM=====================
    @Get('/:notificationId')
    @UseAuth(VerificationJWT)
    @Validator({
        notificationId: Joi.number().required(),
    })
    async findOne(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @PathParams("notificationId") notificationId: number
    ) {
        notificationId = Number(notificationId)
        let notification = await Notification.findOneOrThrowId(notificationId)
        return notification
    }


    // =====================CREATE ITEM=====================
    @Post('')
    @UseAuth(VerificationJWT)
    @Validator({
        notification: Joi.required(),
    })
    async create(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams("notification") notification: Notification,
        @BodyParams('areaId') areaId: number,
    ) {
        if (req.staff.area) areaId = req.staff.area.id
        await notification.assignArea(areaId)
        await notification.save()

        this.expoTokenService.pushNotificationDrivers(notification)
        this.expoTokenService.pushNotificationCustomers(notification)

        return { id: notification.id }
    }

    // =====================UPDATE ITEM=====================
    @Post('/:notificationId/update')
    @UseAuth(VerificationJWT)
    @Validator({
        notification: Joi.required(),
        notificationId: Joi.number().required()
    })
    async update(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams("notification") notification: Notification,
        @PathParams("notificationId") notificationId: number,
    ) {
        notificationId = Number(notificationId)
        // This will check and throw error if not exist 
        await Notification.findOneOrThrowId(notificationId)
        notification.id = notificationId
        await notification.save()
        return { id: notification.id }
    }


    // =====================DELETE=====================
    @Post('/:notificationId/delete')
    @UseAuth(VerificationJWT)
    @Validator({
    })
    async delete(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @PathParams("notificationId") notificationId: number,
    ) {
        let notification = await Notification.findOneOrThrowId(notificationId)
        await notification.remove()
        return res.sendOK(notification)
    }

} // END FILE
