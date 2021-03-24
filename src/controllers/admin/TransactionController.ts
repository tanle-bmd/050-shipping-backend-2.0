import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';
import { Like } from 'typeorm';

import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { Transaction } from '../../entity/Transaction';

@Controller("/admin/transaction")
@Docs("docs_admin")
export class TransactionController {
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
        @Req() req: Request,
        @Res() res: Response
    ) {
        const where = {
            title: Like(`%${search}%`),
        }

        let [transaction, total] = await Transaction.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
            where,
            order: { id: "DESC" },
        })

        return res.sendOK({ data: transaction, total }, "Success")
    }

    // =====================GET ITEM=====================
    @Get('/:transactionId')
    @UseAuth(VerificationJWT)
    @Validator({
        transactionId: Joi.number().required(),
    })
    async findOne(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @PathParams("transactionId") transactionId: number,

    ) {
        transactionId = Number(transactionId)
        let transaction = await Transaction.findOneOrThrowId(transactionId)
        return transaction
    }

    // =====================CREATE ITEM=====================
    @Post('')
    @UseAuth(VerificationJWT)
    @Validator({
        transaction: Joi.required(),
    })
    async create(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams("transaction") transaction: Transaction,
    ) {
        await transaction.save()
        return { id: transaction.id }
    }

    // =====================UPDATE ITEM=====================
    @Post('/:transactionId/update')
    @UseAuth(VerificationJWT)
    @Validator({
        transaction: Joi.required(),
        transactionId: Joi.number().required()
    })
    async update(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams("transaction") transaction: Transaction,
        @PathParams("transactionId") transactionId: number,
    ) {
        transactionId = Number(transactionId)
        // This will check and throw error if not exist 
        await Transaction.findOneOrThrowId(transactionId)
        transaction.id = transactionId
        await transaction.save()
        return { id: transaction.id }
    }

}
