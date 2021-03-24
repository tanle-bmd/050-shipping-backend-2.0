import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';
import { Like, Raw } from 'typeorm';

import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { Customer } from '../../entity/Customer';
import { OrderFood } from '../../entity/OrderFood';
import { OrderDelivery } from '../../entity/OrderDelivery';
import { OrderTransport } from '../../entity/OrderTransport';
import { hashPassword } from '../../util/passwordHelper';

@Controller("/admin/customer")
@Docs("docs_admin")
export class CustomerController {
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
        @QueryParams("limit") limit: number,
        @QueryParams("isBlock") isBlock: boolean,
        @QueryParams("search") search: string = "",
        @QueryParams('areaId') areaId: number,
        @Req() req: Request,
        @Res() res: Response
    ) {
        if (req.staff.area) areaId = req.staff.area.id
        let where = `customer.phone LIKE '%${search}%'`
        if (req.query.isBlock) {
            where += ` AND customer.isBlock = ${req.query.isBlock}`
        }
        if (areaId) {
            where += ` AND area.id = ${areaId}`
        }
        let [customer, total] = await Customer.createQueryBuilder('customer')
            .leftJoinAndSelect('customer.area', 'area')
            .where(where)
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('customer.id', 'DESC')
            .getManyAndCount()

        return res.sendOK({ data: customer, total }, "Success")
    }

    // =====================GET ORDER FOOD=====================
    @Get('/:customerId/orderFood')
    @UseAuth(VerificationJWT)
    @Validator({
        page: Joi.number().min(0),
        limit: Joi.number().min(0),
        customerId: Joi.number().required(),
    })
    async getOrderFood(
        @HeaderParams("token") token: string,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 10,
        @PathParams("customerId") customerId: number,
        @QueryParams("search") search: string = "",
        @QueryParams("status") status: string,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const where = {
            code: Raw(alias => `concat( ${alias}, " ", startAddress) LIKE "%${search}%"`),
            customer: { id: customerId },
            status
        }
        if (req.query.status === undefined) delete where.status

        let [orders, total] = await OrderFood.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
            where,
            order: { id: "DESC" },
            relations: ['driver', 'customer', 'store', 'details']
        })
        const totalIncome = orders.reduce((acc, order) => acc + order.moneyIncome, 0)
        const totalRevenue = orders.reduce((acc, order) => acc + (order.moneyDistance - order.moneyIncome), 0)

        return res.sendOK({ data: orders, total, totalIncome, totalRevenue }, "Success")
    }

    // =====================GET ORDER DELIVERY=====================
    @Get('/:customerId/orderDelivery')
    @UseAuth(VerificationJWT)
    @Validator({
        page: Joi.number().min(0),
        limit: Joi.number().min(0),
        customerId: Joi.number().required(),
    })
    async getOrderDelivery(
        @HeaderParams("token") token: string,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 10,
        @PathParams("customerId") customerId: number,
        @QueryParams("search") search: string = "",
        @QueryParams("status") status: string,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const where = {
            code: Raw(alias => `concat( ${alias}, " ", receiverName, " ", receiverPhone, " ", startAddress, " ", endAddress) LIKE "%${search}%"`),
            customer: { id: customerId },
            status
        }
        if (req.query.status === undefined) delete where.status

        let [orders, total] = await OrderDelivery.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
            where,
            order: { id: "DESC" },
            relations: ['driver', 'customer', 'details']
        })
        const totalIncome = orders.reduce((acc, order) => acc + order.moneyIncome, 0)
        const totalRevenue = orders.reduce((acc, order) => acc + (order.moneyDistance - order.moneyIncome), 0)

        return res.sendOK({ data: orders, total, totalIncome, totalRevenue }, "Success")
    }

    // =====================GET ORDER TRANSPORT=====================
    @Get('/:customerId/orderTransport')
    @UseAuth(VerificationJWT)
    @Validator({
        page: Joi.number().min(0),
        limit: Joi.number().min(0),
        customerId: Joi.number().required(),
    })
    async getOrderTransport(
        @HeaderParams("token") token: string,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 10,
        @PathParams("customerId") customerId: number,
        @QueryParams("search") search: string = "",
        @QueryParams("status") status: string,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const where = {
            code: Raw(alias => `concat( ${alias}, " ", startAddress, " ", endAddress) LIKE "%${search}%"`),
            customer: { id: customerId },
            status
        }
        if (req.query.status === undefined) delete where.status

        let [orders, total] = await OrderTransport.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
            where,
            order: { id: "DESC" },
            relations: ['driver', 'customer']
        })
        const totalIncome = orders.reduce((acc, order) => acc + order.moneyIncome, 0)
        const totalRevenue = orders.reduce((acc, order) => acc + (order.moneyDistance - order.moneyIncome), 0)

        return res.sendOK({ data: orders, total, totalIncome, totalRevenue }, "Success")
    }

    // =====================UPDATE ITEM=====================
    @Post('/:customerId/update')
    @UseAuth(VerificationJWT)
    @Validator({
        customer: Joi.required(),
        customerId: Joi.number().required()
    })
    async update(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams("customer") customer: Customer,
        @PathParams("customerId") customerId: number,
    ) {
        customerId = Number(customerId)
        // This will check and throw error if not exist 
        await Customer.findOneOrThrowId(customerId)
        customer.id = customerId
        await customer.save()
        return { id: customer.id }
    }


    // =====================UPDATE ITEM=====================
    @Post('/:customerId/password/update')
    @UseAuth(VerificationJWT)
    @Validator({
        customerId: Joi.number().required(),
        password: Joi.string().min(6).required()
    })
    async updatePassword(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams("password") password: string,
        @PathParams("customerId") customerId: number,
    ) {
        const customer = await Customer.findOneOrThrowId(+customerId)
        customer.password = await hashPassword(password)
        await customer.save()
        return res.sendOK(customer)
    }

    // =====================GET ITEM=====================
    @Get('/:customerId')
    @UseAuth(VerificationJWT)
    @Validator({
        customerId: Joi.number().required(),
    })
    async findOne(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @PathParams("customerId") customerId: number,

    ) {
        customerId = Number(customerId)
        let customer = await Customer.findOneOrThrowId(customerId)
        return customer
    }

} // END FILE
