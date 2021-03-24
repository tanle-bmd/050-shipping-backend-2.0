import { Property } from "@tsed/common";
import { Customer } from "../entity/Customer";

export class CustomerUpdate {
    toCustomer(): Customer {
        let customer = new Customer()
        customer.dayOfBirth = this.dayOfBirth
        customer.gender = this.gender
        customer.name = this.name
        customer.avatar = this.avatar
        return customer
    }

    @Property()
    dayOfBirth: string;

    @Property()
    gender: string

    @Property()
    name: string;

    @Property()
    avatar: string;
}

