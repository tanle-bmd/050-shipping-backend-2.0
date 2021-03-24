import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';

import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { Food } from '../../entity/Food';
import { MultipartFile } from '@tsed/multipartfiles';
import config from '../../../config';
import { FoodService } from '../../services/FoodService';

@Controller("/admin/foods")
@Docs("docs_admin")
export class FoodController {
    constructor(
        private foodService: FoodService,
    ) { }

    // =====================GET LIST=====================
    @Get()
    @Validator({
        page: Joi.number().min(0),
        limit: Joi.number().min(0)
    })
    async findAll(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 0,
        @QueryParams("storeId") storeId: number,
        @QueryParams("menuFoodId") menuFoodId: number,
        @QueryParams("search") search: string = ""
    ) {
        const { foods, total } = await this.foodService.getManyAndCount({
            page, limit, search, storeId, menuFoodId
        })

        return res.sendOK({ data: foods, total }, "Success")
    }


    // =====================CREATE ITEM=====================
    @Post('')
    @UseAuth(VerificationJWT)
    @Validator({
        food: Joi.required(),
        storeId: Joi.number().required()
    })
    async create(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams("food") food: Food,
        @BodyParams("storeId") storeId: number,
        @BodyParams('menuFoodId') menuFoodId: number,
        @BodyParams('galleries', String) galleries: string[],
    ) {
        food = await this.foodService.create({ storeId, menuFoodId, food, galleries })
        return res.sendOK(food)
    }


    // =====================UPDATE ITEM=====================
    @Post('/:foodId/update')
    @UseAuth(VerificationJWT)
    @Validator({
        food: Joi.required(),
        foodId: Joi.number().required()
    })
    async update(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams("food") food: Food,
        @PathParams("foodId") foodId: number,
        @BodyParams('menuFoodId') menuFoodId: number,
        @BodyParams('galleries', String) galleries: string[],
    ) {
        food = await this.foodService.update({ foodId: +foodId, food, menuFoodId, storeId: null, galleries })
        return res.sendOK(food)
    }

    // =====================UPLOAD IMAGE=====================
    @Post('/image/upload')
    @UseAuth(VerificationJWT)
    uploadFile(
        @MultipartFile('image') file: Express.Multer.File,
        @HeaderParams("token") token: string
    ) {
        file.path = file.path.replace(config.UPLOAD_DIR, "");
        return file
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
