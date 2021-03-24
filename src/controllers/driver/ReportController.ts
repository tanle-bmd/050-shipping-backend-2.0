import { Controller, UseAuth, Req, Get, Res, Response, HeaderParams, PathParams, QueryParams } from '@tsed/common';
import Joi from '@hapi/joi';
import { Docs } from '@tsed/swagger';
import { Request } from 'express';

import { Validator } from '../../middleware/validator/Validator';
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { ReportService } from '../../services/ReportService';
import { getThisMonthInterval, convertFullDateToInt } from '../../util/helper';
import { TransactionService } from '../../services/TransactionService';

@Controller("/driver/report")
@Docs("docs_driver")
export class ReportController {
    constructor(
        private reportService: ReportService,
        private transactionService: TransactionService
    ) { }

    @Get('')
    @UseAuth(VerificationJWT)
    @Validator({
        from: Joi.required(),
        to: Joi.required()
    })
    async findAll(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @HeaderParams("version") version: string,
        @QueryParams("from") from: Date,
        @QueryParams("to") to: Date,
    ) {
        let { start, end } = getThisMonthInterval()
        if (from && to) {
            const dateFrom = convertFullDateToInt(from)
            start = dateFrom.start
            const dateTo = convertFullDateToInt(to)
            end = dateTo.end
        }
        console.log('start:', start)
        console.log('end:', end)
        const reports = await this.transactionService.getReport(req.driver, start, end)
        return res.sendOK(reports)
    }

    @Get('/date')
    @UseAuth(VerificationJWT)
    @Validator({
        date: Joi.required()
    })
    async findByDay(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @QueryParams("date") date: Date
    ) {
        const { start, end } = convertFullDateToInt(date)
        const reports = await this.reportService.getReportByDriver(req.driver, start, end)
        return res.sendOK(reports)
    }
}
