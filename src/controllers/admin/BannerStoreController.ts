// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';
import { Like } from 'typeorm';


// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { BannerStore } from '../../entity/BannerStore';
import { Store } from '../../entity/Store';
import { MultipartFile } from '@tsed/multipartfiles';
import config from '../../../config';


@Controller("/admin/bannerStore")
@Docs("docs_admin")
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
        @QueryParams("limit") limit: number,
        @QueryParams("search") search: string = "",
        @QueryParams('areaId') areaId: number,
        @Req() req: Request,
        @Res() res: Response
    ) {
        let where = `bannerStore.title LIKE '%${search}%'`
        if (req.staff.area) areaId = req.staff.area.id
        if (areaId) {
            where += ` AND area.id = ${areaId}`
        }
        const [bannerStore, total] = await BannerStore.createQueryBuilder('bannerStore')
            .leftJoinAndSelect('bannerStore.area', 'area')
            .leftJoinAndSelect('bannerStore.store', 'store')
            .where(where)
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('bannerStore.id', 'DESC')
            .getManyAndCount()

        return res.sendOK({ data: bannerStore, total })
    }


    // =====================CREATE ITEM=====================
    @Post('')
    @UseAuth(VerificationJWT)
    @Validator({
        bannerStore: Joi.required(),
    })
    async create(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams("bannerStore") bannerStore: BannerStore,
        @BodyParams("storeId") storeId: number,
        @BodyParams('areaId') areaId: number,
    ) {
        if (req.staff.area) areaId = req.staff.area.id
        const store = await Store.findOneOrThrowId(storeId)
        bannerStore.store = store
        if (areaId) await bannerStore.assignArea(areaId)
        await bannerStore.save()
        return res.sendOK(bannerStore)
    }


    // =====================UPDATE ITEM=====================
    @Post('/:bannerStoreId/update')
    @UseAuth(VerificationJWT)
    @Validator({
        bannerStore: Joi.required(),
        bannerStoreId: Joi.number().required()
    })
    async update(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams("bannerStore") bannerStore: BannerStore,
        @PathParams("bannerStoreId") bannerStoreId: number,
        @BodyParams("storeId") storeId: number,
        @BodyParams('areaId') areaId: number,
    ) {
        if (req.staff.area) areaId = req.staff.area.id
        // This will check and throw error if not exist 
        await BannerStore.findOneOrThrowId(bannerStoreId)
        bannerStore.id = +bannerStoreId
        if (areaId) await bannerStore.assignArea(areaId)
        if (storeId) {
            const store = await Store.findOneOrThrowId(storeId)
            bannerStore.store = store
        }
        await bannerStore.save()
        return res.sendOK(bannerStore)
    }


    // =====================UPLOAD IMAGE=====================
    @Post('/image/upload')
    @UseAuth(VerificationJWT)
    uploadFile(
        @MultipartFile('image') file: Express.Multer.File,
        @HeaderParams('token') token: string
    ) {
        file.path = file.path.replace(config.UPLOAD_DIR, '');
        return file;
    }

} // END FILE
