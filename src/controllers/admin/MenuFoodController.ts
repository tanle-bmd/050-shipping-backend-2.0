// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';
import { Like } from 'typeorm';


// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { MenuFood } from '../../entity/MenuFood';
import { Store } from '../../entity/Store';
import { MenuFoodService } from '../../services/MenuFoodService';


@Controller("/admin/menuFood")
@Docs("docs_admin")
export class MenuFoodController {
    constructor(
        private menuFoodService: MenuFoodService,
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
        @QueryParams("limit") limit: number = 0,
        @QueryParams("search") search: string = "",
        @QueryParams('storeId') storeId: number,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const { menuFoods, total } = await this.menuFoodService.getManyAndCount({ search, page, limit, storeId })

        return res.sendOK({ menuFoods, total });
    }


    // =====================CREATE ITEM=====================
    @Post('')
    @UseAuth(VerificationJWT)
    @Validator({
        menuFood: Joi.required(),
        storeId: Joi.required(),
    })
    async create(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("menuFood") menuFood: MenuFood,
        @BodyParams('storeId') storeId: number,
    ) {
        menuFood = await this.menuFoodService.create(+storeId, menuFood)

        return res.sendOK(menuFood)
    }


    // =====================UPDATE ITEM=====================
    @Post('/:menuFoodId/update')
    @UseAuth(VerificationJWT)
    @Validator({
        menuFood: Joi.required(),
        menuFoodId: Joi.number().required()
    })
    async update(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("menuFood") menuFood: MenuFood,
        @PathParams("menuFoodId") menuFoodId: number,
    ) {
        await MenuFood.findOneOrThrowId(menuFoodId)
        menuFood.id = +menuFoodId
        await menuFood.save()

        return res.sendOK(menuFood)
    }


    // =====================DELETE=====================
    @Post('/:menuFoodId/delete')
    @UseAuth(VerificationJWT)
    @Validator({
    })
    async delete(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("menuFoodId") menuFoodId: number,
    ) {
        let menuFood = await MenuFood.findOneOrThrowId(menuFoodId)
        menuFood.isDeleted = true
        await menuFood.save()
        return res.sendOK(menuFood)
    }

} // END FILE
