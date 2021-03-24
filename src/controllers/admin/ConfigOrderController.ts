// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';


// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { ConfigOrder } from '../../entity/ConfigOrder';
import { ConfigOrderService } from '../../services/ConfigOrderService';


@Controller("/admin/configOrder")
@Docs("docs_admin")
export class ConfigOrderController {
    constructor(
        private configOrderService: ConfigOrderService,
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

        const configs = await this.configOrderService.getConfigsByArea(areaId)

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
        await this.configOrderService.init(areaId)

        return res.sendOK(null)
    }


    // =====================UPDATE ITEM=====================
    @Post('/:configOrderId/update')
    @UseAuth(VerificationJWT)
    @Validator({
        configOrder: Joi.required(),
        configOrderId: Joi.number().required()
    })
    async update(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("configOrder") configOrder: ConfigOrder,
        @PathParams("configOrderId") configOrderId: number,
    ) {
        await ConfigOrder.findOneOrThrowId(configOrderId)
        configOrder.id = +configOrderId
        await configOrder.save()

        return res.sendOK(configOrder)
    }

} // END FILE
