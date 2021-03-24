import { Entity, PrimaryGeneratedColumn, Column, Unique, ManyToOne, OneToMany } from "typeorm";
import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Customer } from "./Customer";
import { Driver } from "./Driver";
import { Minimum, Maximum, Property } from "@tsed/common";
import md5 from "md5";
import moment from "moment";
import { Staff } from './Staff';

@Entity(addPrefix("withdraw"))
@Unique("code", ["code"])
export class Withdraw extends CoreEntity {
    generateCode() {
        this.code = "WI" +
            this.driver.id +
            md5(`${moment().valueOf()}`).substring(0, 5)
    }
    constructor() {
        super()
    }

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @Property()
    code: string;

    @Column()
    @Property()
    amount: number

    @ManyToOne(type => Driver, driver => driver.withdraws)
    driver: Driver

    @ManyToOne(type => Staff, staff => staff.withdraws)
    creator: Staff
}
