// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';


// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { Tip } from '../../entity/Tip';


@Controller("/admin/tip")
@Docs("docs_admin")
export class TipController {
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
        @QueryParams('areaId') areaId: number,
        @Req() req: Request,
        @Res() res: Response
    ) {
        if (req.staff.area) areaId = req.staff.area.id

        let where = `tip.isDeleted = false
        AND area.id = ${areaId}`
        const tips = await Tip.createQueryBuilder('tip')
            .leftJoinAndSelect('tip.area', 'area')
            .where(where)
            .orderBy('tip.money', 'ASC')
            .getMany()

        return res.sendOK(tips);
    }


    // =====================CREATE ITEM=====================
    @Post('')
    @UseAuth(VerificationJWT)
    @Validator({
        tip: Joi.required(),
    })
    async create(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("tip") tip: Tip,
        @BodyParams('areaId') areaId: number,
    ) {
        if (req.staff.area) areaId = req.staff.area.id

        await tip.assignArea(areaId)
        await tip.save()

        return res.sendOK(tip)
    }


    // =====================UPDATE ITEM=====================
    @Post('/:tipId/update')
    @UseAuth(VerificationJWT)
    @Validator({
        tip: Joi.required(),
        tipId: Joi.number().required()
    })
    async update(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("tip") tip: Tip,
        @PathParams("tipId") tipId: number,
    ) {
        await Tip.findOneOrThrowId(tipId)
        tip.id = +tipId
        await tip.save()

        return res.sendOK(tip)
    }


    // =====================DELETE=====================
    @Post('/:tipId/delete')
    @UseAuth(VerificationJWT)
    @Validator({
    })
    async delete(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("tipId") tipId: number,
    ) {
        let tip = await Tip.findOneOrThrowId(tipId)
        tip.isDeleted = true
        await tip.save()
        return res.sendOK(tip)
    }

} // END FILE
