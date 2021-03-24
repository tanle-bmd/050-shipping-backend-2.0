// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';


// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { BannerStore, BannerStoreType } from '../../entity/BannerStore';


@Controller("/customer/bannerStore")
@Docs("docs_customer")
export class BannerStoreController {
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
        @QueryParams("search") search: string = "",
        @QueryParams('type') type: BannerStoreType,
        @Req() req: Request,
        @Res() res: Response
    ) {
        let where = `bannerStore.isShow = true`

        if (req.customer.area) {
            where += ` AND area.id = ${req.customer.area.id}`
        }

        if (type) {
            where += ` AND bannerStore.type = '${type}'`
        }

        const [banner, total] = await BannerStore.createQueryBuilder('bannerStore')
            .leftJoinAndSelect('bannerStore.store', 'store')
            .leftJoinAndSelect('bannerStore.area', 'area')
            .where(where)
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('bannerStore.id', 'DESC')
            .getManyAndCount()

        return res.sendOK({ data: banner, total })
    }


} // END FILE
