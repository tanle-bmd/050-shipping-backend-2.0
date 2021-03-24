import { Property } from "@tsed/common";
import { Driver } from '../entity/Driver';

export class DriverUpdate {
    toDriver(): Driver {
        let driver = new Driver()
        driver.name = this.name
        driver.phone = this.phone
        driver.nickname = this.nickname
        driver.avatar = this.avatar
        driver.isBlock = this.isBlock
        driver.dayOfBirth = this.dayOfBirth
        return driver
    }

    @Property()
    name: string

    @Property()
    nickname: string

    @Property()
    avatar: string

    @Property()
    phone: string

    @Property()
    isBlock: boolean

    @Property()
    dayOfBirth: string;

}
