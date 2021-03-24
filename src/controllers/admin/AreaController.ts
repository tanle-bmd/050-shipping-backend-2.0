// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';


// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { Area } from '../../entity/Area';


@Controller("/admin/area")
@Docs("docs_admin")
export class AreaController {
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
        @Req() req: Request,
        @Res() res: Response
    ) {
        const [areas, total] = await Area.createQueryBuilder('area')
            .where(`area.name LIKE "%${search}%" AND area.isDeleted = false `)
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('area.id', 'DESC')
            .getManyAndCount()

        return res.sendOK({ areas, total });
    }


    // =====================CREATE ITEM=====================
    @Post('')
    @UseAuth(VerificationJWT)
    @Validator({
        area: Joi.required(),
    })
    async create(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("area") area: Area,
    ) {
        await area.save()
        return res.sendOK(area)
    }


    // =====================UPDATE ITEM=====================
    @Post('/:areaId/update')
    @UseAuth(VerificationJWT)
    @Validator({
        area: Joi.required(),
        areaId: Joi.number().required()
    })
    async update(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("area") area: Area,
        @PathParams("areaId") areaId: number,
    ) {
        await Area.findOneOrThrowId(areaId)
        area.id = +areaId
        await area.save()

        return res.sendOK(area)
    }


    // =====================DELETE=====================
    @Post('/:areaId/delete')
    @UseAuth(VerificationJWT)
    @Validator({
    })
    async delete(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("areaId") areaId: number,
    ) {
        let area = await Area.findOneOrThrowId(areaId)
        area.isDeleted = true
        await area.save()
        return res.sendOK(area)
    }

} // END FILE
