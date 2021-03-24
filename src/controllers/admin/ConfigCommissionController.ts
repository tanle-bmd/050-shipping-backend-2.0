// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';


// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { ConfigCommission } from '../../entity/ConfigCommission';
import { ConfigCommissionService } from '../../services/ConfigCommissionService';


@Controller("/admin/configCommission")
@Docs("docs_admin")
export class ConfigCommissionController {
    constructor(
        private configCommissionService: ConfigCommissionService,
    ) { }


    // =====================GET LIST=====================
    @Get('')
    @UseAuth(VerificationJWT)
    @Validator({
    })
    async findAll(
        @HeaderParams("token") token: string,
        @QueryParams('areaId') areaId: number,
        @Req() req: Request,
        @Res() res: Response
    ) {
        if (req.staff.area) areaId = req.staff.area.id

        const configs = await this.configCommissionService.getConfigsByArea(areaId)

        return res.sendOK(configs)
    }


    // =====================CREATE ITEM=====================
    @Post('/init')
    @UseAuth(VerificationJWT)
    @Validator({})
    async create(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams('areaId') areaId: number,
    ) {
        if (req.staff.area) areaId = req.staff.area.id
        await this.configCommissionService.init(areaId)

        return res.sendOK(null)
    }


    // =====================UPDATE ITEM=====================
    @Post('/:configCommissionId/update')
    @UseAuth(VerificationJWT)
    @Validator({
        configCommission: Joi.required(),
        configCommissionId: Joi.number().required()
    })
    async update(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("configCommission") configCommission: ConfigCommission,
        @PathParams("configCommissionId") configCommissionId: number,
    ) {
        await ConfigCommission.findOneOrThrowId(configCommissionId)
        configCommission.id = +configCommissionId
        await configCommission.save()

        return res.sendOK(configCommission)
    }

} // END FILE
