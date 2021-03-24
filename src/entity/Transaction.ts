import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Property } from "@tsed/common";
import { Driver } from "./Driver";

export enum TYPE_TRANSACTION {
    deposit = 'DEPOSIT',
    withdraw = 'WITHDRAW',
    income = 'INCOME'
}

@Entity(addPrefix("transaction"))
export class Transaction extends CoreEntity {
    constructor() {
        super()
    }

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @Property()
    code: string

    @Column()
    @Property()
    change: number;

    @Column()
    @Property()
    balanceAfterChange: number;

    @Column()
    @Property()
    type: TYPE_TRANSACTION;

    @ManyToOne(type => Driver, driver => driver.deposits)
    driver: Driver
}
