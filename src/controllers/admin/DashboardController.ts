import { Controller, UseAuth, Req, Get, Res, Response, HeaderParams, PathParams, QueryParams } from '@tsed/common';
import Joi from '@hapi/joi';
import { Docs } from '@tsed/swagger';
import { Request } from 'express';

import { Validator } from '../../middleware/validator/Validator';
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';

import { DashboardService } from '../../services/DashboardService';
import { convertFullDateToInt, getFromToDate } from '../../util/helper';

@Controller("/admin/dashboard")
@Docs("docs_admin")
export class DashboardController {
    constructor(private dashboardService: DashboardService) { }

    @Get('')
    @UseAuth(VerificationJWT)
    @Validator({})
    async findAll(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @QueryParams("from") from: Date,
        @QueryParams("to") to: Date,
        @QueryParams('areaId') areaId: number,
    ) {
        const { start, end } = getFromToDate(from, to)
        if (req.staff.area) areaId = req.staff.area.id
        return this.dashboardService.getSummary(start, end, areaId)
    }


    @Get('/customerLast30')
    @UseAuth(VerificationJWT)
    @Validator({})
    async getCustomerLast30(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @QueryParams("from") from: Date,
        @QueryParams("to") to: Date,
        @QueryParams('areaId') areaId: number,
    ) {
        return { report: await this.dashboardService.getCustomerLast30(from, to, areaId) }
    }

    @Get('/orderFoodLast30')
    @UseAuth(VerificationJWT)
    @Validator({})
    async getOrderFoodLast30(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @QueryParams("from") from: Date,
        @QueryParams("to") to: Date,
        @QueryParams('areaId') areaId: number,
    ) {
        if (req.staff.area) areaId = req.staff.area.id
        return { report: await this.dashboardService.getOrderFoodLast30(from, to, areaId) }
    }

    @Get('/orderDeliveryLast30')
    @UseAuth(VerificationJWT)
    @Validator({})
    async getOrderDeliveryLast30(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @QueryParams("from") from: Date,
        @QueryParams("to") to: Date,
        @QueryParams('areaId') areaId: number,
    ) {
        if (req.staff.area) areaId = req.staff.area.id
        return { report: await this.dashboardService.getOrderDeliveryLast30(from, to, areaId) }
    }

    @Get('/orderTransportLast30')
    @UseAuth(VerificationJWT)
    @Validator({})
    async getOrderTransportLast30(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @QueryParams("from") from: Date,
        @QueryParams("to") to: Date,
        @QueryParams('areaId') areaId: number,
    ) {
        if (req.staff.area) areaId = req.staff.area.id
        return { report: await this.dashboardService.getOrderTransportLast30(from, to, areaId) }
    }

    @Get('/top5DriversThisMonth')
    @UseAuth(VerificationJWT)
    @Validator({})
    async getTop5Driver(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @QueryParams('areaId') areaId: number,
    ) {
        if (req.staff.area) areaId = req.staff.area.id
        const top5 = await this.dashboardService.getTop5Drivers(areaId)
        return { top5 }
    }

    @Get('/top5CustomerThisMonth')
    @UseAuth(VerificationJWT)
    @Validator({})
    async getTop5Customer(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @QueryParams('areaId') areaId: number,
    ) {
        if (req.staff.area) areaId = req.staff.area.id
        const top5 = await this.dashboardService.getTop5Customers(areaId)
        return { top5 }
    }
}
