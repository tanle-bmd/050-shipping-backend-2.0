import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Property } from "@tsed/common";
import { OrderDelivery } from "./OrderDelivery";

@Entity(addPrefix("order_delivery_detail"))
export class OrderDeliveryDetail extends CoreEntity {
    constructor() {
        super()
    }

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @Property()
    name: string

    @Column({ default: 0 })
    @Property()
    weight: number

    @Column({ nullable: true })
    @Property()
    note: string

    @ManyToOne(type => OrderDelivery, orderDelivery => orderDelivery.details)
    order: OrderDelivery

}
