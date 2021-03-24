import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';

import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { Withdraw } from '../../entity/Withdraw';
import logger from '../../util/logger';
import { TYPE_TRANSACTION, Transaction } from '../../entity/Transaction';
import { Driver } from '../../entity/Driver';
import { WithdrawService } from '../../services/WithdrawService';
import { convertFullDateToInt, getFromToDate } from '../../util/helper';

@Controller("/admin/withdraw")
@Docs("docs_admin")
export class WithdrawController {
    constructor(
        private withdrawService: WithdrawService
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
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 10,
        @QueryParams("search") search: string = "",
        @QueryParams("driverId") driverId: number = 0,
        @QueryParams("from") from: Date,
        @QueryParams("to") to: Date,
        @QueryParams('areaId') areaId: number,
        @Req() req: Request,
        @Res() res: Response
    ) {
        let withdraw = null
        let total = null
        let withdrawDate: Withdraw[] = []

        let where = `CONCAT(withdraw.code, driver.phone) LIKE "%${search}%"`

        if (from && to) {
            const { start, end } = getFromToDate(from, to)
            where += ` AND withdraw.dateCreated BETWEEN ${start} AND ${end}`
        }

        if (areaId) {
            where += ` AND area.id = ${areaId}`
        }

        if (driverId) {
            [withdraw, total] = await Withdraw.createQueryBuilder("withdraw")
                .addSelect("driver")
                .skip((page - 1) * limit)
                .take(limit)
                .innerJoin("withdraw.driver", "driver", `driver.id = ${driverId}`)
                .leftJoin("driver.area", "area")
                .where(where)
                .orderBy('withdraw.id', 'DESC')
                .getManyAndCount()

            withdrawDate = await Withdraw.createQueryBuilder("withdraw")
                .where(where)
                .innerJoin("withdraw.driver", "driver", `driver.id = ${driverId}`)
                .leftJoin("driver.area", "area")
                .getMany()

        } else {
            [withdraw, total] = await Withdraw.createQueryBuilder("withdraw")
                .addSelect("driver")
                .skip((page - 1) * limit)
                .take(limit)
                .leftJoin("withdraw.driver", "driver")
                .leftJoin("driver.area", "area")
                .where(where)
                .orderBy('withdraw.id', 'DESC')
                .getManyAndCount()

            withdrawDate = await Withdraw.createQueryBuilder("withdraw")
                .where(where)
                .leftJoin("withdraw.driver", "driver")
                .leftJoin("driver.area", "area")
                .getMany()
        }

        const sum = withdrawDate.reduce((acc, withdraw) => acc += withdraw.amount, 0)

        return res.sendOK({ data: withdraw, total, sum }, "Success")
    }

    // =====================GET ITEM=====================
    @Get('/:withdrawId')
    @UseAuth(VerificationJWT)
    @Validator({
        withdrawId: Joi.number().required(),
    })
    async findOne(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @PathParams("withdrawId") withdrawId: number,

    ) {
        withdrawId = Number(withdrawId)
        let withdraw = await Withdraw.findOneOrThrowId(withdrawId)
        return withdraw
    }

    // =====================CREATE ITEM=====================
    @Post('')
    @UseAuth(VerificationJWT)
    @Validator({
        amount: Joi.number().required(),
        driverId: Joi.number().required(),
    })
    async create(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams("amount") amount: number,
        @BodyParams("driverId") driverId: number,
    ) {
        // Create withdraw
        const driver = await Driver.findOneOrThrowId(driverId)
        let withdraw = new Withdraw()
        withdraw.amount = amount
        withdraw.creator = req.staff
        withdraw.driver = driver

        withdraw.driver.balance -= withdraw.amount
        if (withdraw.driver.balance <= 0) {
            return res.sendClientError("Tài xế không đủ tiền để rút")
        }
        withdraw.generateCode()
        // Store transaction
        const transaction = new Transaction()
        transaction.change = amount
        transaction.balanceAfterChange = driver.balance - amount
        transaction.code = withdraw.code
        transaction.type = TYPE_TRANSACTION.withdraw
        transaction.driver = driver
        await transaction.save()
        // Store withdraw
        try {
            await this.withdrawService.withDrawTransaction(withdraw)
        } catch (error) {
            logger("error").error("ERROR WITHDRAW", error)
            return res.sendFail("Rút tiền thất bại vui lòng thử lại sau")
        }

        return { id: withdraw.id }
    }

}
