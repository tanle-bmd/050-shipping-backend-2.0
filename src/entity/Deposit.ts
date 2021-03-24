import { Entity, PrimaryGeneratedColumn, Column, Unique, ManyToOne, OneToMany } from "typeorm";
import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Driver } from "./Driver";
import { Minimum, Maximum, Property } from "@tsed/common";
import moment from "moment";
import md5 from "md5";
import { Staff } from "./Staff";


@Entity(addPrefix("deposit"))
@Unique("code", ["code"])
export class Deposit extends CoreEntity {
    generateCode() {
        this.code = "DE" +
            this.driver.id +
            md5(`${moment().valueOf()}`).substring(0, 5)
    }
    constructor() {
        super()
    }

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    code: string;

    @Column()
    @Property()
    amount: number

    @ManyToOne(type => Driver, driver => driver.deposits)
    driver: Driver

    @ManyToOne(type => Staff, staff => staff.deposits)
    creator: Staff

}
