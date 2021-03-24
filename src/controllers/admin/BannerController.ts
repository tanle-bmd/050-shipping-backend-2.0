// IMPORT LIBRARY
import { MultipartFile, MulterOptions } from '@tsed/multipartfiles';
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';
import { Like } from 'typeorm';

// IMPORT CUSTOM
import config from '../../../config';
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { Banner } from '../../entity/Banner';


// Admin - Banner
@Controller("/admin/banner")
@Docs("docs_admin")
export class BannerController {
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
        @QueryParams("limit") limit: number = 10,
        @QueryParams('areaId') areaId: number,
        @Req() req: Request,
        @Res() res: Response
    ) {
        let where = ``
        if (req.staff.area) areaId = req.staff.area.id
        if (areaId) {
            where += `area.id = ${areaId}`
        }

        const [banner, total] = await Banner.createQueryBuilder('banner')
            .leftJoinAndSelect('banner.area', 'area')
            .where(where)
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('banner.id', 'DESC')
            .getManyAndCount()

        return res.sendOK({ data: banner, total })
    }


    // =====================CREATE ITEM=====================
    @Post('')
    @UseAuth(VerificationJWT)
    @Validator({
        banner: Joi.required(),
    })
    async create(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams("banner") banner: Banner,
        @BodyParams('areaId') areaId: number,
    ) {
        if (req.staff.area) areaId = req.staff.area.id
        if (areaId) await banner.assignArea(areaId)
        await banner.save()

        return res.sendOK(banner)
    }


    // =====================UPDATE ITEM=====================
    @Post('/:bannerId/update')
    @UseAuth(VerificationJWT)
    @Validator({
        banner: Joi.required(),
        bannerId: Joi.number().required()
    })
    async update(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams("banner") banner: Banner,
        @PathParams("bannerId") bannerId: number,
        @BodyParams('areaId') areaId: number,
    ) {
        if (req.staff.area) areaId = req.staff.area.id
        // This will check and throw error if not exist 
        await Banner.findOneOrThrowId(bannerId)
        if (areaId) await banner.assignArea(areaId)
        banner.id = +bannerId
        await banner.save()
        return res.sendOK(banner)
    }


    // =====================DELETE=====================
    @Post('/:bannerId/delete')
    @UseAuth(VerificationJWT)
    @Validator({
    })
    async delete(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @PathParams("bannerId") bannerId: number,
    ) {
        let banner = await Banner.findOneOrThrowId(bannerId)
        await banner.remove()
        return res.sendOK(banner)
    }


    // =====================UPLOAD IMAGE=====================
    @Post('/image/upload')
    @MulterOptions({})
    @UseAuth(VerificationJWT)
    uploadFile(
        @MultipartFile('image') file: any,
        @HeaderParams('token') token: string
    ) {
        file.path = file.path.replace(config.UPLOAD_DIR, '');
        return file;
    }

} //END FILE
