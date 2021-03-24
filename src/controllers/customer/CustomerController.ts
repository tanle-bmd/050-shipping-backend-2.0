import { validatePassword } from './../../util/passwordHelper';
import { MailService } from './../../services/MailService';
import { Controller, UseAuth, Req, Get, Res, Response, HeaderParams, PathParams, Post, BodyParams, QueryParams } from '@tsed/common';
import Joi from '@hapi/joi';
import { Docs } from '@tsed/swagger';
import { Request } from 'express';

import { Validator } from '../../middleware/validator/Validator';
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Customer } from '../../entity/Customer';
import { CustomerService } from '../../services/CustomerService';
import JWT, { AuthType } from '../../middleware/auth/strategy/JWT';
import { CustomerInsert } from '../../entity-request/CustomerInsert';
import { MultipartFile, MulterOptions } from '@tsed/multipartfiles';
import config from '../../../config';
import { CustomerUpdate } from '../../entity-request/CustomerUpdate';
import { getCurrentTimeInt, randomString, isNumberPhoneVN } from '../../util/helper';
import { hashPassword } from '../../util/passwordHelper';
import { OTP } from '../../util/otp';

@Controller("/customer")
@Docs("docs_customer")
export class CustomerController {

    constructor(
        private customerService: CustomerService,
        private mailService: MailService
    ) { }


    // =====================CHECK PHONE=====================
    @Get('/check/device')
    @Validator({
        deviceId: Joi.string().required(),
    })
    async checkDevice(
        @QueryParams("deviceId") deviceId: string,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const isBlockedDevice = await Customer.findOne({
            where: { deviceId, isBlock: true }
        })

        if (isBlockedDevice) {
            return res.sendForbidden("Thiết bị của bạn đã bị khoá")
        } else {
            return res.sendOK(null)
        }
    }

    // =====================CHECK PHONE=====================
    @Get('/:phone/exist')
    async check(
        @PathParams("phone") phone: string,
        @HeaderParams("deviceId") deviceId: string,
        @Req() req: Request,
        @Res() res: Response
    ) {
        if (!isNumberPhoneVN(phone)) {
            return res.sendClientError('Số điện thoại không hợp lệ!')
        }

        const isBlockedDevice = await Customer.findOne({
            where: { deviceId, isBlock: true }
        })

        const customer = await Customer.findOne({
            select: ["password", 'id', 'isBlock', 'expoToken', 'deviceId'],
            where: { phone }
        })

        if (!customer) {
            return {
                isExist: false,
                password: false,
                isMatchDevice: false
            }
        }

        const isMatchDevice = deviceId ? deviceId == customer.deviceId : false

        if (customer.password) {
            return {
                isExist: true,
                password: true,
                isMatchDevice
            }
        } else {
            return {
                isExist: true,
                password: false,
                isMatchDevice
            }
        }
    }


    // =====================LOGIN=====================
    // @Get('/otp')
    // @Validator({
    //     phone: Joi.string().required(),
    // })
    // async sendOTP(
    //     @Req() req: Request,
    //     @Res() res: Response,
    //     @QueryParams("phone") phone: string,
    // ) {
    //     const otp = new Otp()
    //     otp.toOtp()
    //     otp.phone = phone
    //     await otp.save()

    //     const result = await sendSmsOTP(phone, otp.code)
    //     result
    //         ? res.sendOK(null, 'Gửi sms thành công')
    //         : res.sendClientError('Gửi mã OTP thất bại! Vui lòng thử lại sau.')
    // }

    // =====================LOGIN=====================
    @Post('/login')
    @Validator({
        phone: Joi.required(),
    })
    async login(
        @Req() req: Request,
        @BodyParams('phone') phone: string,
        @BodyParams('password') password: string,
        @BodyParams('expoToken') expoToken: string,
        @BodyParams('deviceId') deviceId: string,
        @Res() res: Response
    ) {
        if (!isNumberPhoneVN(phone)) {
            return res.sendClientError('Số điện thoại không hợp lệ!')
        }

        const customer = await Customer.findOne({
            select: ["password", 'id', 'isBlock', 'expoToken', 'deviceId'],
            where: { phone }
        })

        if (!customer) {
            return res.sendClientError("Số điện thoại không tồn tại.")
        }

        if (customer.isBlock) {
            return res.sendClientError('Tài khoản tạm thời bị khóa, vui lòng liên hệ tổng đài để được hổ trợ.')
        }

        if (!deviceId || deviceId != customer.deviceId) {
            if (! await validatePassword(password, customer.password)) {
                return res.sendClientError("Mật khẩu chưa chính xác.")
            }
        }

        if (deviceId) {
            customer.deviceId = deviceId
            await customer.save()
        }

        customer.expoToken = expoToken
        await customer.save()

        const token = JWT.sign({ id: customer.id, type: AuthType.Customer })
        return { token }
    }

    // =====================SIGNUP=====================
    @Post('/:phone/password')
    @Validator({
    })
    async updatePassword(
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("phone") phone: string,
        @BodyParams("password") password: string,
        @BodyParams("email") email: string,
    ) {
        if (!phone) {
            return res.sendClientError('Vui lòng nhập số điện thoại')
        }

        if (!isNumberPhoneVN(phone)) {
            return res.sendClientError('Số điện thoại không hợp lệ!')
        }

        const customer = await Customer.findOne({
            select: ["password", 'id', 'isBlock', 'expoToken'],
            where: { phone }
        })

        customer.password = await hashPassword(password)
        customer.email = email
        await customer.save()

        const token = JWT.sign({ id: customer.id, type: AuthType.Customer })

        return res.sendOK({ token }, "Cập nhật mật khẩu thành công")
    }


    // =====================SIGNUP=====================
    @Post('/signup')
    async create(
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("customer") customer: CustomerInsert,
        @BodyParams('deviceId') deviceId: string,
    ) {
        const newCustomer = await customer.toCustomer()

        let oldCustomer = await Customer.findOne({
            where: [{
                phone: customer.phone
            }, {
                email: customer.email
            }]
        })

        if (oldCustomer) {
            return res.sendClientError("Số điện thoại hoặc email đã được sử dụng!")
        }

        if (deviceId) {
            newCustomer.deviceId = deviceId
        }
        await newCustomer.save()
        const token = JWT.sign({ id: newCustomer.id, type: AuthType.Customer })

        return { token }
    }

    // =====================GET INFO=====================
    @Get('/myself/info')
    @UseAuth(VerificationJWT)
    async getInfo(
        @HeaderParams("token") token: string,
        @HeaderParams("deviceId") deviceId: string,
        @Req() req: Request
    ) {
        const { customer } = req

        if (deviceId) {
            customer.deviceId = deviceId
            await customer.save()
        }

        return customer
    }

    // =====================UPDATE INFO=====================
    @Post('/myself/update')
    @UseAuth(VerificationJWT)
    @Validator({
        customerId: Joi.number().required()
    })
    async update(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams("customer") customer: CustomerUpdate,
        @BodyParams("customerId") customerId: number,
        @BodyParams('areaId') areaId: number,
    ) {
        if (req.customer.id != customerId) {
            return res.sendForbidden('Bạn không được chỉnh sủa thông tin của người khác!')
        }
        let updatedCustomer = customer.toCustomer()
        updatedCustomer.id = customerId
        if (areaId) await updatedCustomer.assignArea(areaId)
        await updatedCustomer.save()
        return customer
    }

    // =====================UPLOAD IMAGE=====================
    @Post('/image/upload')
    @MulterOptions({})
    @UseAuth(VerificationJWT)
    uploadFile(
        @MultipartFile('image') file: Express.Multer.File,
        @HeaderParams("token") token: string) {
        file.path = file.path.replace(config.UPLOAD_DIR, "");
        return file
    }

    // =====================FORGOT=====================
    @Post('/password/forgot')
    @Validator({
        email: Joi.required(),
    })
    async forgot(
        @BodyParams("email") email: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const customer = await Customer.findOne({ where: { email } })
        if (!customer) {
            return res.sendClientError('Email không tồn tại')
        }

        const forgotCode = OTP.create()
        customer.forgotCode = forgotCode
        await customer.save()

        this.mailService.sendMailLinkReset(forgotCode, customer)

        return res.sendOK({}, 'Vui lòng kiểm tra email và truy cập vào đường link xác nhận.')
    }


    // =====================CONFIRM FORGOT=====================
    @Post('/password/forgot/confirm')
    @Validator({
        code: Joi.required(),
    })
    async reForgot(
        @BodyParams("code") code: string,
        @BodyParams("password") password: string,
        @BodyParams("expoToken") expoToken: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const ONE_MINUTE_IN_SECOND = 60
        let where = `customer.forgotCode = '${code}' 
        AND customer.dateUpdated > ${getCurrentTimeInt() - 10 * ONE_MINUTE_IN_SECOND}`
        const customer = await Customer.createQueryBuilder('customer')
            .where(where)
            .getOne()

        if (!customer) {
            return res.sendClientError("Vui lòng gửi yêu cầu quên mật khẩu mới và chờ email xác nhập gửi về.")
        }

        if (expoToken) {
            customer.expoToken = expoToken
        }

        customer.password = await hashPassword(password)
        customer.forgotCode = ''
        await customer.save()

        const token = JWT.sign({ id: customer.id, type: AuthType.Customer })

        return { token }
    }

    // ====================LOGOUT=====================
    @Post('/logout')
    @UseAuth(VerificationJWT)
    @Validator({
        expoToken: Joi.string(),
    })
    async logout(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("expoToken") expoToken: string,
    ) {
        req.customer.expoToken = ''
        await req.customer.save()
        res.sendOK({})
    }

}
