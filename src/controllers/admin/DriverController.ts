import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';
import { Like, Raw } from 'typeorm';

import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { Driver } from '../../entity/Driver';
import { DriverInsert } from '../../entity-request/DriverInsert';
import { hashPassword } from '../../util/passwordHelper';
import { DriverUpdate } from '../../entity-request/DriverUpdate';
import { OrderFood } from '../../entity/OrderFood';
import { OrderDelivery } from '../../entity/OrderDelivery';
import { OrderTransport } from '../../entity/OrderTransport';
import { MultipartFile } from '@tsed/multipartfiles';
import config from '../../../config';
import { getFromToDate } from '../../util/helper';

@Controller("/admin/driver")
@Docs("docs_admin")
export class DriverController {

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
        @QueryParams("isBlock") isBlock: boolean,
        @QueryParams("search") search: string = "",
        @QueryParams('areaId') areaId: number,
        @Req() req: Request,
        @Res() res: Response
    ) {
        if (req.staff.area) areaId = req.staff.area.id
        let where = `driver.phone LIKE '%${search}%'`

        if (areaId) {
            where += ` AND area.id = ${areaId}`
        }

        if (req.query.isBlock != undefined) {
            where += ` AND driver.isBlock = ${req.query.isBlock}`
        }

        let [driver, total] = await Driver.createQueryBuilder('driver')
            .leftJoinAndSelect('driver.area', 'area')
            .where(where)
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('driver.id', 'DESC')
            .getManyAndCount()

        return res.sendOK({ data: driver, total }, "Success")
    }


    // =====================GET ORDER FOOD=====================
    @Get('/:driverId/orderFood')
    @UseAuth(VerificationJWT)
    @Validator({
        page: Joi.number().min(0),
        limit: Joi.number().min(0),
        driverId: Joi.number().required(),
    })
    async getOrderFood(
        @HeaderParams("token") token: string,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 10,
        @PathParams("driverId") driverId: number,
        @QueryParams("search") search: string = "",
        @QueryParams("status") status: string,
        @QueryParams("from") from: Date,
        @QueryParams("to") to: Date,
        @Req() req: Request,
        @Res() res: Response
    ) {
        let where = `orderFood.code LIKE '%${search}%'`

        if (status) {
            where += ` AND orderFood.status = '${status}'`
        }

        if (driverId) {
            where += ` AND driver.id = ${driverId}`
        }

        if (from && to) {
            const { start, end } = getFromToDate(from, to)
            where += ` AND orderFood.dateCreated  BETWEEN ${start} AND ${end} `
        }

        const [orders, total] = await OrderFood.createQueryBuilder('orderFood')
            .leftJoinAndSelect('orderFood.driver', 'driver')
            .leftJoinAndSelect('orderFood.customer', 'customer')
            .leftJoinAndSelect('orderFood.details', 'details')
            .leftJoinAndSelect('orderFood.store', 'store')
            .where(where)
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('orderFood.id', 'DESC')
            .getManyAndCount()

        const ordersDate = await OrderFood.createQueryBuilder('orderFood')
            .leftJoinAndSelect('orderFood.driver', 'driver')
            .where(where)
            .orderBy('orderFood.id', 'DESC')
            .getMany()

        const totalIncome = ordersDate.reduce((acc, order) => acc + order.moneyIncome, 0)
        const totalRevenue = ordersDate.reduce((acc, order) => acc + (order.moneyDistance - order.moneyIncome), 0)

        return res.sendOK({ data: orders, total, totalIncome, totalRevenue })
    }


    // =====================GET ORDER DELIVERY=====================
    @Get('/:driverId/orderDelivery')
    @UseAuth(VerificationJWT)
    @Validator({
        page: Joi.number().min(0),
        limit: Joi.number().min(0),
        driverId: Joi.number().required(),
    })
    async getOrderDelivery(
        @HeaderParams("token") token: string,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 10,
        @PathParams("driverId") driverId: number,
        @QueryParams("search") search: string = "",
        @QueryParams("status") status: string,
        @QueryParams("from") from: Date,
        @QueryParams("to") to: Date,
        @Req() req: Request,
        @Res() res: Response
    ) {
        let where = `orderDelivery.code LIKE '%${search}%'`

        if (status) {
            where += ` AND orderDelivery.status = '${status}'`
        }

        if (driverId) {
            where += ` AND driver.id = ${driverId}`
        }

        if (from && to) {
            const { start, end } = getFromToDate(from, to)
            where += ` AND orderDelivery.dateCreated  BETWEEN ${start} AND ${end} `
        }

        const [orders, total] = await OrderDelivery.createQueryBuilder('orderDelivery')
            .leftJoinAndSelect('orderDelivery.driver', 'driver')
            .leftJoinAndSelect('orderDelivery.customer', 'customer')
            .leftJoinAndSelect('orderDelivery.details', 'details')
            .where(where)
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('orderDelivery.id', 'DESC')
            .getManyAndCount()

        const ordersDate = await OrderDelivery.createQueryBuilder('orderDelivery')
            .leftJoinAndSelect('orderDelivery.driver', 'driver')
            .where(where)
            .orderBy('orderDelivery.id', 'DESC')
            .getMany()

        const totalIncome = ordersDate.reduce((acc, order) => acc + order.moneyIncome, 0)
        const totalRevenue = ordersDate.reduce((acc, order) => acc + (order.moneyDistance - order.moneyIncome), 0)

        return res.sendOK({ data: orders, total, totalIncome, totalRevenue })
    }


    // =====================GET ORDER TRANSPORT=====================
    @Get('/:driverId/orderTransport')
    @UseAuth(VerificationJWT)
    @Validator({
        page: Joi.number().min(0),
        limit: Joi.number().min(0),
        driverId: Joi.number().required(),
    })
    async getOrderTransport(
        @HeaderParams("token") token: string,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 10,
        @PathParams("driverId") driverId: number,
        @QueryParams("search") search: string = "",
        @QueryParams("status") status: string,
        @QueryParams("from") from: Date,
        @QueryParams("to") to: Date,
        @Req() req: Request,
        @Res() res: Response
    ) {
        let where = `orderTransport.code LIKE '%${search}%'`

        if (status) {
            where += ` AND orderTransport.status = '${status}'`
        }

        if (driverId) {
            where += ` AND driver.id = ${driverId}`
        }

        if (from && to) {
            const { start, end } = getFromToDate(from, to)
            where += ` AND orderTransport.dateCreated  BETWEEN ${start} AND ${end} `
        }

        const [orders, total] = await OrderTransport.createQueryBuilder('orderTransport')
            .leftJoinAndSelect('orderTransport.driver', 'driver')
            .leftJoinAndSelect('orderTransport.customer', 'customer')
            .where(where)
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('orderTransport.id', 'DESC')
            .getManyAndCount()

        const ordersDate = await OrderTransport.createQueryBuilder('orderTransport')
            .leftJoinAndSelect('orderTransport.driver', 'driver')
            .where(where)
            .orderBy('orderTransport.id', 'DESC')
            .getMany()

        const totalIncome = ordersDate.reduce((acc, order) => acc + order.moneyIncome, 0)
        const totalRevenue = ordersDate.reduce((acc, order) => acc + (order.moneyDistance - order.moneyIncome), 0)

        return res.sendOK({ data: orders, total, totalIncome, totalRevenue })
    }


    // =====================CREATE ITEM=====================
    @Post('')
    @UseAuth(VerificationJWT)
    @Validator({
        driver: Joi.required(),
    })
    async create(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams("driver") driverInsert: DriverInsert,
        @BodyParams('areaId') areaId: number,
    ) {
        if (req.staff.area) areaId = req.staff.area.id
        const driver = driverInsert.toDriver()

        if (areaId) await driver.assignArea(areaId)
        driver.password = await hashPassword(driver.password)
        await driver.save()

        return { id: driver.id }
    }

    // =====================UPDATE ITEM=====================
    @Post('/:driverId/update')
    @UseAuth(VerificationJWT)
    @Validator({
        driver: Joi.required(),
        driverId: Joi.number().required()
    })
    async update(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams("driver") driver: DriverUpdate,
        @PathParams("driverId") driverId: number,
        @BodyParams('areaId') areaId: number,
    ) {
        driverId = Number(driverId)
        // This will check and throw error if not exist 
        await Driver.findOneOrThrowId(driverId)

        const newDriver = driver.toDriver()
        if (newDriver.phone) {
            const oldDriver = await Driver.findOne({ where: { phone: newDriver.phone } })
            if (oldDriver && oldDriver.id != driverId)
                return res.sendClientError("Số điện thoại này đã tồn tại")
        }

        if (areaId) await newDriver.assignArea(areaId)
        newDriver.id = driverId
        await newDriver.save()

        return { id: newDriver.id }
    }


    // =====================RESET PASSWORD=====================
    @Post('/:driverId/resetPassword')
    @UseAuth(VerificationJWT)
    @Validator({
        newPassword: Joi.string().required(),
        driverId: Joi.number().required()
    })
    async resetPassword(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams("newPassword") newPassword: string,
        @PathParams("driverId") driverId: number,
    ) {
        driverId = Number(driverId)
        // This will check and throw error if not exist 
        const driver = await Driver.findOneOrThrowId(driverId)
        driver.password = await hashPassword(newPassword)
        await driver.save()
        return { id: driver.id }
    }


    // =====================UPLOAD AVATAR=====================
    @Post('/avatar/upload')
    @UseAuth(VerificationJWT)
    uploadFile(
        @MultipartFile('image') file: Express.Multer.File,
        @HeaderParams("token") token: string
    ) {
        file.path = file.path.replace(config.UPLOAD_DIR, "");
        return file
    }
}
