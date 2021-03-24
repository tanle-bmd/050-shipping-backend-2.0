import { Controller, UseAuth, Req, Get, Res, Response, HeaderParams, PathParams, Post, BodyParams } from '@tsed/common';
import Joi from '@hapi/joi';
import { Docs } from '@tsed/swagger';
import { Request } from 'express';

import { Validator } from '../../middleware/validator/Validator';
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Driver, STATUS_DRIVER } from '../../entity/Driver';
import { DriverService } from '../../services/DriverService';
import JWT, { AuthType } from '../../middleware/auth/strategy/JWT';
import { validatePassword, hashPassword } from '../../util/passwordHelper';
import { ExpoToken } from '../../entity/ExpoToken';

@Controller("/driver")
@Docs("docs_driver")
export class DriverController {
    constructor(private driverService: DriverService) { }

    // =====================GET INFO=====================
    @Get('/myself/info')
    @UseAuth(VerificationJWT)
    async getInfo(
        @Req() req: Request,
        @HeaderParams("token") token: string,
        @HeaderParams("expoToken") expoToken: string,
    ) {
        console.log('expoToken:', expoToken)
        const { driver } = req
        if (expoToken) {
            driver.expoToken = expoToken
            await driver.save()
        }

        return driver
    }

    // =====================LOGIN=====================
    @Post('/login')
    @Validator({
        // otp: Joi.required(),
        password: Joi.required(),
    })
    async login(
        @Req() req: Request,
        @BodyParams('username') username: string,
        @BodyParams('password') password: string,
        @BodyParams('expoToken') expoToken: string,
        @Res() res: Response
    ) {
        console.log('expoToken:', expoToken)
        const driver = await Driver.findOneOrThrowOption({
            select: ["password", "id", "isBlock"],
            where: [{
                phone: username,
            }, {
                username
            }]
        })

        if (!driver) {
            return res.sendClientError("Tài khoản hoặc mật khẩu không chính xác.")
        }

        if (! await validatePassword(password, driver.password)) {
            return res.sendClientError("Tài khoản hoặc mật khẩu không chính xác.")
        }

        if (driver.isBlock) {
            return res.sendClientError('Tài khoản tạm thời bị khóa, vui lòng liên hệ tổng đài để được hổ trợ.')
        }

        // Handle expo Token
        if (expoToken) {
            driver.expoToken = expoToken
            await driver.save()
        }

        const token = JWT.sign({ id: driver.id, type: AuthType.Driver })
        return { token }
    }

    // =====================UPDATE PASSWORD=====================
    @Post('/password/update')
    @UseAuth(VerificationJWT)
    @Validator({
        oldPassword: Joi.string().required(),
        newPassword: Joi.string().required()
    })
    async changePassword(
        @Req() req: Request,
        @BodyParams('oldPassword') oldPassword: string,
        @BodyParams("newPassword") newPassword: string,
        @HeaderParams("token") token: string,
        @Res() res: Response
    ) {
        const { id } = req.driver
        if (oldPassword == newPassword) {
            return res.sendClientError("Mật khẩu mới không được trùng mật khẩu cũ", {})
        }
        // Get user with old password
        const driver = await this.driverService.isValidPassword(id, oldPassword)
        if (!driver) {
            return res.sendClientError("Mật khẩu cũ không đúng");
        }
        // Update password
        driver.password = await hashPassword(newPassword)
        await driver.save()
        return res.sendOK({}, "Cập nhật mật khẩu thành công")
    }

    // =====================UPDATE STATUS FREE=====================
    @Post('/status/free')
    @UseAuth(VerificationJWT)
    @Validator({
    })
    async turnOn(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
    ) {
        const driver = req.driver
        driver.status = STATUS_DRIVER.free
        await driver.save()
        return res.sendOK(driver)
    }

    // =====================UPDATE STATUS FREE=====================
    @Post('/status/busy')
    @UseAuth(VerificationJWT)
    @Validator({
    })
    async turnOff(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
    ) {
        const driver = req.driver
        driver.status = STATUS_DRIVER.busy
        await driver.save()
        return res.sendOK(driver)
    }

    // =====================UPDATE STATUS FREE=====================
    @Post('/logout')
    @UseAuth(VerificationJWT)
    async logout(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        req.driver.expoToken = ''
        await req.driver.save()
        res.sendOK(req.driver)
    }
}
