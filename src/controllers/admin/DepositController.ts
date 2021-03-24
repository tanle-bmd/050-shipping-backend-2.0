import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';
import { Like, getManager, Raw, getFromContainer } from 'typeorm';

import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { Deposit } from '../../entity/Deposit';
import { Driver } from '../../entity/Driver';
import { Transaction, TYPE_TRANSACTION } from '../../entity/Transaction';
import { DepositService } from '../../services/DepositService';
import { convertFullDateToInt, getFromToDate } from '../../util/helper';

@Controller("/admin/deposit")
@Docs("docs_admin")
export class DepositController {
    constructor(private depositService: DepositService) { }

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
        let deposit = null
        let total = null
        let depositDate: Deposit[] = []

        if (req.staff.area) areaId = req.staff.area.id

        let where = `CONCAT(deposit.code, driver.phone) LIKE "%${search}%"`

        if (from && to) {
            const { start, end } = getFromToDate(from, to)
            where += ` AND deposit.dateCreated BETWEEN ${start} AND ${end}`
        }

        if (areaId) {
            where += ` AND area.id = ${areaId}`
        }

        if (driverId) {
            [deposit, total] = await Deposit.createQueryBuilder("deposit")
                .addSelect("driver")
                .skip((page - 1) * limit)
                .take(limit)
                .innerJoin("deposit.driver", "driver", `driver.id = ${driverId}`)
                .leftJoin("driver.area", "area")
                .where(where)
                .orderBy('deposit.id', 'DESC')
                .getManyAndCount()

            depositDate = await Deposit.createQueryBuilder("deposit")
                .where(where)
                .innerJoin("deposit.driver", "driver", `driver.id = ${driverId}`)
                .leftJoin("driver.area", "area")
                .getMany()
        } else {
            [deposit, total] = await Deposit.createQueryBuilder("deposit")
                .addSelect("driver")
                .skip((page - 1) * limit)
                .take(limit)
                .leftJoin("deposit.driver", "driver")
                .leftJoin("driver.area", "area")
                .where(where)
                .orderBy('deposit.id', 'DESC')
                .getManyAndCount()

            depositDate = await Deposit.createQueryBuilder("deposit")
                .where(where)
                .leftJoin("deposit.driver", "driver")
                .leftJoin("driver.area", "area")
                .getMany()
        }
        const sum = depositDate.reduce((acc, deposit) => acc += deposit.amount, 0)

        return res.sendOK({ data: deposit, total, sum }, "Success")
    }

    // =====================GET ITEM=====================
    @Get('/:depositId')
    @UseAuth(VerificationJWT)
    @Validator({
        depositId: Joi.number().required(),
    })
    async findOne(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @PathParams("depositId") depositId: number,

    ) {
        depositId = Number(depositId)
        const deposit = await Deposit.findOneOrThrowId(depositId, { relations: ["driver", "creator"] })
        return deposit
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
        const driver = await Driver.findOneOrThrowId(driverId)
        let deposit = new Deposit()
        deposit.amount = amount
        deposit.creator = req.staff
        deposit.driver = driver
        deposit.generateCode()

        // Store transaction
        const transaction = new Transaction()
        transaction.change = amount
        transaction.balanceAfterChange = driver.balance + amount
        transaction.code = deposit.code
        transaction.type = TYPE_TRANSACTION.deposit
        transaction.driver = driver
        await transaction.save()

        await this.depositService.depositTransaction(deposit, getManager())
        return { id: deposit.id }
    }

}
