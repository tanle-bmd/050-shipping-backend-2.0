// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';
import { Like } from 'typeorm';

// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { Banner } from '../../entity/Banner';

// Customer - Banner
@Controller("/customer/banner")
@Docs("docs_customer")
export class BannerController {
    constructor() { }

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
        @Req() req: Request,
        @Res() res: Response
    ) {
        let where = `banner.isShow = true`

        if (req.customer.area) {
            where += ` AND area.id = ${req.customer.area.id}`
        }

        const [banner, total] = await Banner.createQueryBuilder('banner')
            .leftJoinAndSelect('banner.area', 'area')
            .where(where)
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('banner.id', 'DESC')
            .getManyAndCount()

        return res.sendOK({ data: banner, total })
    }


    // =====================GET ITEM=====================
    @Get('/:bannerId')
    @UseAuth(VerificationJWT)
    @Validator({
        bannerId: Joi.number().required(),
    })
    async findOne(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @PathParams("bannerId") bannerId: number,
    ) {
        const banner = await Banner.findOneOrThrowId(bannerId)
        return res.sendOK(banner)
    }

} //END FILE
