import { RequestFood, RequestFoodStatus } from '../../entity/RequestFood';
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';
import { Like, Raw } from 'typeorm';

import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { Store, StoreType } from '../../entity/Store';
import { MultipartFile } from '@tsed/multipartfiles';
import config from '../../../config';
import { hashPassword } from '../../util/passwordHelper';
import { RequestFoodService } from '../../services/RequestFoodService';
import { getCurrentDateDDMMYY } from '../../util/helper';

@Controller("/admin/store")
@Docs("docs_admin")
export class StoreController {
    constructor(
        private requestFoodService: RequestFoodService
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
        @QueryParams("type") type: StoreType,
        @QueryParams("isBlock") isBlock: boolean,
        @QueryParams('areaId') areaId: number,
        @Req() req: Request,
        @Res() res: Response
    ) {
        let where = `store.name LIKE '%${search}%' AND store.isDeleted = false`

        if (type) {
            where += ` AND store.type = '${type}'`
        }

        if (req.query.isBlock != undefined) {
            where += ` AND store.isBlock = ${req.query.isBlock}`
        }

        if (req.staff.area) areaId = req.staff.area.id
        if (areaId) {
            where += ` AND area.id = ${areaId}`
        }

        let [store, total] = await Store.createQueryBuilder('store')
            .leftJoinAndSelect('store.area', 'area')
            .where(where)
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('store.id', 'DESC')
            .getManyAndCount()

        return res.sendOK({ data: store, total })
    }


    // =====================GET ITEM=====================
    @Get('/:storeId')
    @UseAuth(VerificationJWT)
    @Validator({
        storeId: Joi.number().required(),
    })
    async findOne(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @PathParams("storeId") storeId: number,

    ) {
        storeId = Number(storeId)
        let store = await Store.findOneOrThrowId(storeId)
        return store
    }

    // =====================GET REQUEST=====================
    @Get('/:storeId/request')
    @UseAuth(VerificationJWT)
    @Validator({
        storeId: Joi.number().required(),
    })
    async getRequest(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @PathParams("storeId") storeId: number,
    ) {
        const requests = await RequestFood.find({
            relations: ['food', 'store'],
            where: {
                store: { id: storeId },
                status: RequestFoodStatus.Pending
            }
        })

        return res.sendOK(requests)
    }

    // =====================GET ITEM=====================
    @Get('/:storeId/request/:requestId/approve')
    @UseAuth(VerificationJWT)
    @Validator({
        storeId: Joi.number().required(),
        requestId: Joi.number().required(),
    })
    async approveRequest(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @PathParams("storeId") storeId: number,
        @PathParams("requestId") requestId: number,
    ) {

        const request = await RequestFood.findOneOrThrowId(requestId,
            {
                relations: ['food', 'store']
            }
            , 'Yêu cầu'
        )
        await this.requestFoodService.approve(request)
        return res.sendOK(request)
    }

    // =====================CREATE ITEM=====================
    @Post('')
    @UseAuth(VerificationJWT)
    @Validator({
        store: Joi.required(),
    })
    async create(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams("store") store: Store,
        @BodyParams('areaId') areaId: number,
    ) {
        if (store.lat == 0 && store.long == 0) {
            return res.sendClientError("Vui lòng nhập địa chỉ trên bản đồ.")
        }

        store.password = await hashPassword('123456')
        await store.save() // Must save to get id to init username

        store.username = `${getCurrentDateDDMMYY()}${store.id}`

        if (req.staff.area) areaId = req.staff.area.id
        if (areaId) await store.assignArea(areaId)

        await store.save()


        return { id: store.id }
    }

    // =====================UPDATE ITEM=====================
    @Post('/:storeId/update')
    @UseAuth(VerificationJWT)
    @Validator({
        store: Joi.required(),
        storeId: Joi.number().required()
    })
    async update(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams("store") store: Store,
        @PathParams("storeId") storeId: number,
        @BodyParams('areaId') areaId: number,
    ) {
        storeId = Number(storeId)
        await Store.findOneOrThrowId(storeId)
        if (req.staff.area) areaId = req.staff.area.id
        if (areaId) await store.assignArea(areaId)
        store.id = storeId
        await store.save()
        return { id: store.id }
    }


    @Post('/:storeId/password/update')
    @UseAuth(VerificationJWT)
    @Validator({
        storeId: Joi.number().required()
    })
    async updatePassword(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams("password") password: string,
        @PathParams("storeId") storeId: number,
    ) {
        const store = await Store.findOneOrThrowId(+storeId)
        store.password = await hashPassword(password)
        await store.save()
        return { store }
    }


    // =====================UPLOAD IMAGE=====================
    @Post('/image/upload')
    @UseAuth(VerificationJWT)
    uploadFile(
        @MultipartFile('image') file: Express.Multer.File,
        @HeaderParams("token") token: string) {
        file.path = file.path.replace(config.UPLOAD_DIR, "");
        return file
    }


    // =====================DELETE=====================
    @Post('/:storeId/delete')
    @UseAuth(VerificationJWT)
    @Validator({
    })
    async delete(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("storeId") storeId: number,
    ) {
        let store = await Store.findOneOrThrowId(storeId)
        store.isDeleted = true
        await store.save()
        return res.sendOK(store)
    }

} // END FILE
