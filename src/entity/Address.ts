import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Property } from "@tsed/common";
import { Customer } from "./Customer";

@Entity(addPrefix("address"))
export class Address extends CoreEntity {
    constructor() {
        super()
    }

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @Property()
    address: string

    @ManyToOne(type => Customer, customer => customer.addresses)
    customer: Customer;

}
