import { RequestFood, RequestFoodType } from '../../entity/RequestFood';
// IMPORT LIBRARY
import { Controller, UseAuth, Req, Get, Res, Response, HeaderParams, PathParams, Post, BodyParams, QueryParams } from '@tsed/common';
import Joi from '@hapi/joi';
import { Docs } from '@tsed/swagger';
import { Request } from 'express';


// IMPORT CUSTOM
import { Validator } from '../../middleware/validator/Validator';
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Food } from '../../entity/Food';
import { FoodService } from '../../services/FoodService';


@Controller("/store/food")
@Docs("docs_store")
export class FoodController {
    constructor(
        private foodService: FoodService,
    ) { }


    // =====================INDEX=====================
    @Get('')
    @UseAuth(VerificationJWT)
    @Validator({})
    async index(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 0,
        @QueryParams("menuFoodId") menuFoodId: number,
        @QueryParams("search") search: string = ""
    ) {
        const { foods, total } = await this.foodService.getManyAndCount({
            page, limit, search, storeId: req.store.id, menuFoodId
        })
        return res.sendOK({ foods, total })
    }

    // =====================INDEX=====================
    @Post('/')
    @UseAuth(VerificationJWT)
    @Validator({})
    async create(
        @HeaderParams("token") token: string,
        @BodyParams("food") food: Food,
        @BodyParams('menuFoodId') menuFoodId: number,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams('galleries', String) galleries: string[],
    ) {
        food = await this.foodService.create({ food, storeId: req.store.id, menuFoodId, galleries })
        return res.sendOK(food)
    }

    // =====================INDEX=====================
    @Post('/:foodId/update')
    @UseAuth(VerificationJWT)
    @Validator({})
    async update(
        @HeaderParams("token") token: string,
        @BodyParams("food") food: Food,
        @PathParams("foodId") foodId: number,
        @BodyParams('menuFoodId') menuFoodId: number,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams('galleries', String) galleries: string[],
    ) {
        food = await this.foodService.update({ foodId: +foodId, food, storeId: null, menuFoodId, galleries })
        return res.sendOK(food)
    }


    // =====================DELETE=====================
    @Post('/:foodId/delete')
    @UseAuth(VerificationJWT)
    @Validator({
    })
    async delete(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("foodId") foodId: number,
    ) {
        let food = await Food.findOneOrThrowId(foodId)
        food.isDeleted = true
        await food.save()
        return res.sendOK(food)
    }

} // END FILE
