import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';
import { Like } from 'typeorm';

import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { Address } from '../../entity/Address';

@Controller("/customer/address")
@Docs("docs_customer")
export class AddressController {
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
        @QueryParams("limit") limit: number = 0,
        @QueryParams("search") search: string = "",
        @Req() req: Request,
        @Res() res: Response
    ) {
        const where = {
            address: Like(`%${search}%`),
        }

        let [address, total] = await Address.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
            where,
            order: { id: "DESC" },
        })

        return res.sendOK({ data: address, total }, "Success")
    }

    // =====================GET ITEM=====================
    @Get('/:addressId')
    @UseAuth(VerificationJWT)
    @Validator({
        addressId: Joi.number().required(),
    })
    async findOne(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @PathParams("addressId") addressId: number,

    ) {
        addressId = Number(addressId)
        let address = await Address.findOneOrThrowId(addressId)
        return address
    }

    // =====================CREATE ITEM=====================
    @Post('')
    @UseAuth(VerificationJWT)
    @Validator({
        address: Joi.required(),
    })
    async create(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams("address") address: Address,
    ) {
        await address.save()
        return { id: address.id }
    }

    // =====================UPDATE ITEM=====================
    @Post('/:addressId/update')
    @UseAuth(VerificationJWT)
    @Validator({
        address: Joi.required(),
        addressId: Joi.number().required()
    })
    async update(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams("address") address: Address,
        @PathParams("addressId") addressId: number,
    ) {
        addressId = Number(addressId)
        // This will check and throw error if not exist 
        await Address.findOneOrThrowId(addressId)
        address.id = addressId
        await address.save()
        return { id: address.id }
    }
}
