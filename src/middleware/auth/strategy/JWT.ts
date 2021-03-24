import { BadRequest, Exception, Forbidden } from 'ts-httpexceptions';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { Unauthorized } from 'ts-httpexceptions';

import AuthStrategy from './AuthStrategy';
import config from '../../../../config'
import { Staff } from '../../../entity/Staff';
import { Customer } from '../../../entity/Customer';
import { Driver } from '../../../entity/Driver';
import { Store } from '../../../entity/Store';
import compareVersions from 'compare-versions';
import CONFIG from '../../../../config';
import logger from '../../../util/logger';
import { getCurrentTimeInt } from '../../../util/helper';

const VERSION = '1.0.8'

export enum AuthType {
    Staff = "ADMIN",
    Customer = "CUSTOMER",
    Driver = "DRIVER",
    Store = "STORE"
}

interface JWTSignedData {
    id: number,
    type: AuthType,
    ia?: number
}

interface RequestHeaders {
    token?: string,
    version?: string
}


export default class JWT implements AuthStrategy {

    public async auth(req: Request): Promise<any> {
        let baseUrl = req.baseUrl

        if (this.checkRouter(baseUrl, AuthType.Staff)) {
            await this.authenticateStaff(req)
            return
        }

        if (this.checkRouter(baseUrl, AuthType.Driver) && !baseUrl.includes(`logout`)) {
            await this.authenticateDriver(req)
            return
        }

        if (this.checkRouter(baseUrl, AuthType.Store)) {
            await this.authenticateStore(req)
            return
        }

        await this.authenticateCustomer(req);
    }


    private checkRouter(baseUrl: string, type: AuthType) {
        return baseUrl.includes(`${CONFIG.PREFIX_URL}/${type.toLowerCase()}`);
    }


    private async authenticateStaff(req: Request) {
        let type = AuthType.Staff
        const { token, version } = <{ token: string, version: string }>req.headers
        let staffId = this.getAuthenId(token, type);

        if (!staffId) throw new Unauthorized("Xác thực không hợp lệ!");

        const staff = await Staff.findOneOrThrowId(staffId, {
            relations: ['area']
        })

        req.staff = staff;
        req.auth_type = type
    }

    private checkVersion(clientVersion: string) {
        if (!clientVersion || (VERSION && compareVersions(VERSION, clientVersion) > 0)) {
            throw new BadRequest(`Phiên bản hiện tại chưa được cập nhật. Vui lòng thoát hoàn toàn ứng dụng (bao gồm chạy ngầm) rồi mở lại. Nếu vẫn chưa được hãy lên cửa hàng ứng dụng cập nhật lại phiên bản mới nhất.`)
        }
    }

    private async authenticateDriver(req: Request) {
        let type = AuthType.Driver
        const { token, version } = <{ token: string, version: string }>req.headers

        this.checkVersion(version)

        let driverId = this.getAuthenId(token, type);

        if (!driverId)
            throw new Unauthorized("Xác thực không hợp lệ!");

        const driver = await Driver.findOne({
            relations: ['area'],
            where: { id: driverId }
        });
        if (!driver)
            throw new Unauthorized("Tài khoản không tồn tại!");

        if (driver.isBlock)
            throw new Unauthorized('Tài khoản tạm thời bị khóa, vui lòng liên hệ tổng đài để được hổ trợ.')

        req.driver = driver;
        req.auth_type = type
    }

    private async authenticateStore(req: Request) {
        let type = AuthType.Store
        const { token, version } = <{ token: string, version: string }>req.headers

        let storeId = this.getAuthenId(token, type);

        if (!storeId)
            throw new Unauthorized("Xác thực không hợp lệ!");

        const store = await Store.findOne(
            {
                relations: ['foods', 'area'],
                where: {
                    id: storeId,
                    isDeleted: false
                }
            });

        if (!store)
            throw new Unauthorized("Tài khoản không tồn tại!");

        if (store.isBlock)
            throw new Unauthorized('Tài khoản tạm thời bị khóa, vui lòng liên hệ tổng đài để được hổ trợ.')

        req.store = store;
        req.auth_type = type
    }

    private async authenticateCustomer(req: Request) {
        let type = AuthType.Customer
        const { token, version } = <{ token: string, version: string }>req.headers

        this.checkVersion(version)

        let customerId = this.getAuthenId(token, type);
        if (!customerId)
            throw new Unauthorized("Xác thực không hợp lệ!");

        const customer = await Customer.findOne({
            relations: ['area'],
            where: { id: customerId }
        });
        if (!customer)
            throw new Unauthorized("Tài khoản không tồn tại!");

        if (customer.isBlock)
            throw new Forbidden('Tài khoản tạm thời bị khóa, vui lòng liên hệ tổng đài để được hổ trợ.')

        req.customer = customer;
        req.auth_type = type
    }


    public getAuthenId(token: any, type: AuthType): number {
        if (!token) {
            throw new Unauthorized("Xác thực không hợp lệ!")
        }

        try {
            const decoded = <JWTSignedData>jwt.verify(token, CONFIG.JWT_SECRET)
            if (decoded.id && decoded.type == type) {
                return decoded.id
            } else {
                throw new Unauthorized("Xác thực không hợp lệ!")
            }
        } catch (error) {
            logger('error').error('Error Get Authenticate ID: ', JSON.stringify(error))
            throw new Unauthorized("Xác thực không hợp lệ!")
        }
    }


    static getIa(token: string): number {
        if (!token) {
            return 0
        }

        try {
            const decoded = <JWTSignedData>jwt.verify(token, CONFIG.JWT_SECRET)
            return decoded.ia
        } catch (error) {
            return 0
        }
    }


    static sign(data: JWTSignedData): string {
        data = { ...data, ia: getCurrentTimeInt() }
        return jwt.sign(data, CONFIG.JWT_SECRET, { expiresIn: CONFIG.JWT_EXPIRE })
    }

}
