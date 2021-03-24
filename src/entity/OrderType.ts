import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Property, Minimum } from "@tsed/common";
import { Area } from "./Area";

export enum ORDER_TYPE {
    food = 'FOOD',
    transport = 'TRANSPORT',
    delivery = 'DELIVERY'
}

@Entity(addPrefix("order_type"))
export class OrderType extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @Property()
    type: ORDER_TYPE

    @Column({ default: 0 })
    @Minimum(0)
    @Property()
    minPrice: number

    @Column({ default: 0 })
    @Minimum(0)
    @Property()
    kmMinPrice: number

    @Column({ default: 0 })
    @Minimum(0)
    @Property()
    pricePerKM: number


    // RELATIONS


    // METHODS

} // END FILE
