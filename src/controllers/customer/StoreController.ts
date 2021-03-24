import { Controller, UseAuth, Req, Get, Res, Response, HeaderParams, PathParams, QueryParams } from '@tsed/common';
import Joi from '@hapi/joi';
import { Docs } from '@tsed/swagger';
import { Request } from 'express';

import { Validator } from '../../middleware/validator/Validator';
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Store, StoreType } from '../../entity/Store';
import { StoreService } from '../../services/StoreService';
import { Like, Raw } from 'typeorm';
import { Food } from '../../entity/Food';
import { MenuFood } from '../../entity/MenuFood';

const DISTANCE_SHOW_STORE = 30 // in kilometer

@Controller("/customer/store")
@Docs("docs_customer")
export class StoreController {
    constructor(private storeService: StoreService) { }

    // =====================GET LIST STORE=====================
    @Get('')
    @UseAuth(VerificationJWT)
    @Validator({})
    async findAll(
        @HeaderParams("token") token: string,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 10,
        @QueryParams("lat") lat: number = 0,
        @QueryParams("long") long: number = 0,
        @QueryParams("search") search: string = "",
        @QueryParams("type") type: string,
        @Req() req: Request,
        @Res() res: Response
    ) {
        let where = `store.isBlock = 0 
        AND store.isClosed = 0
        AND store.isDeleted = false`

        let having = `distance < ${DISTANCE_SHOW_STORE}`

        if (req.query.search) {
            where += ` AND ( store.name LIKE '%${search}%' OR food.name LIKE '%${search}%')`
        }

        if (req.query.type) {
            where += ` AND store.type = '${type}'`
        }

        if (req.customer.isDeveloper) {
            having = ``
        }

        const stores = await Store.createQueryBuilder('store')
            .select('distinct store.id, store.*')
            .addSelect(`111.111 *
                    DEGREES(ACOS(LEAST(1.0, COS(RADIANS(store.lat))
                    * COS(RADIANS(${lat}))
                    * COS(RADIANS(store.long - ${long}))
                    + SIN(RADIANS(store.lat))
                    * SIN(RADIANS(${lat})))))`, 'distance')
            .where(where)
            .offset((page - 1) * limit)
            .limit(limit)
            .leftJoin('store.foods', 'food', 'food.isBlock = 0 AND food.isDeleted = 0')
            .having(having)
            .orderBy('distance', 'ASC')
            .getRawMany()

        return res.sendOK({ data: stores }, "Success")

    }

    // =====================GET STORE INFO=====================
    @Get('/:storeId')
    @UseAuth(VerificationJWT)
    @Validator({
        storeId: Joi.number().min(0)
    })
    async findOne(
        @HeaderParams("token") token: string,
        @PathParams("storeId") storeId: number,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const store = await Store.findOneOrThrowId(+storeId, { relations: ['menuFoods', ''] }, '')
        return store
    }

    @Get('/:storeId/food')
    @UseAuth(VerificationJWT)
    @Validator({
        storeId: Joi.number().min(0)
    })
    async findAllFood(
        @HeaderParams("token") token: string,
        @PathParams("storeId") storeId: number,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const foods = await Food.find({
            relations: ['foodGalleries', 'menuFood'],
            where: {
                store: { id: storeId },
                isShow: true,
                isBlock: false,
                isDeleted: false
            },
            order: { position: 'DESC' }
        })
        return res.sendOK({ foods })
    }

    @Get('/:storeId/menu')
    @UseAuth(VerificationJWT)
    @Validator({
        storeId: Joi.number().min(0)
    })
    async findAllMenu(
        @HeaderParams("token") token: string,
        @PathParams("storeId") storeId: number,
        @Req() req: Request,
        @Res() res: Response
    ) {
        let where = `menuFood.isDeleted = false
        AND store.id = ${storeId}`
        const menus = await MenuFood.createQueryBuilder('menuFood')
            .leftJoinAndSelect('menuFood.store', 'store')
            .where(where)
            .orderBy('menuFood.id', 'DESC')
            .getMany()

        return res.sendOK(menus)
    }
}
