import { Controller, UseAuth, Req, Get, Res, Response, HeaderParams, PathParams, QueryParams } from '@tsed/common';
import Joi from '@hapi/joi';
import { Docs } from '@tsed/swagger';
import { Request } from 'express';

import { Validator } from '../../middleware/validator/Validator';
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { ReportService } from '../../services/ReportService';
import moment from 'moment';
import { getMonthInterval } from '../../util/helper';

@Controller("/admin/report")
@Docs("docs_admin")
export class ReportController {
    constructor(private reportService: ReportService) { }

    @Get('')
    @UseAuth(VerificationJWT)
    @Validator({
        month: Joi.number().required(),
        year: Joi.number().required()
    })
    async findAll(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @QueryParams("month") month: number,
        @QueryParams("year") year: number,
    ) {
        const { start, end } = getMonthInterval(new Date(`${year}-${month}-01`))
        return await this.reportService.getReport(start, end)
    }
}
