import { Property } from "@tsed/common";
import { Driver } from '../entity/Driver';

export class DriverInsert {
    toDriver(): Driver {
        let driver = new Driver()
        driver.phone = this.phone
        driver.username = this.username
        driver.password = this.password
        driver.licensePlate = this.licensePlate
        driver.name = this.name
        driver.nickname = this.nickname
        driver.avatar = this.avatar
        driver.dayOfBirth = this.dayOfBirth
        return driver
    }

    @Property()
    phone: string

    @Property()
    username: string

    @Property()
    password: string;

    @Property()
    licensePlate: string;

    @Property()
    name: string

    @Property()
    nickname: string

    @Property()
    avatar: string

    @Property()
    dayOfBirth: string;

}
