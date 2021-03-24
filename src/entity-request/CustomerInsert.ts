import { BadRequest } from 'ts-httpexceptions';
import { Property } from "@tsed/common";
import { Customer } from "../entity/Customer";
import { hashPassword } from "../util/passwordHelper";
import { isNumberPhoneVN } from '../util/helper';

export class CustomerInsert {
    async toCustomer(): Promise<Customer> {
        let customer = new Customer()
        if (!this.phone) {
            throw new BadRequest('Vui lòng nhập số điện thoại')
        }

        if (!isNumberPhoneVN(this.phone)) {
            throw new BadRequest('Số điện thoại không hợp lệ!')
        }

        customer.phone = this.phone
        customer.dayOfBirth = this.dayOfBirth
        customer.gender = this.gender
        customer.name = this.name
        customer.avatar = this.avatar
        customer.email = this.email
        customer.password = await hashPassword(this.password)
        return customer
    }

    @Property()
    password: string

    @Property()
    phone: string

    @Property()
    email: string

    @Property()
    dayOfBirth: string;

    @Property()
    gender: string

    @Property()
    name: string;

    @Property()
    avatar: string;
}
