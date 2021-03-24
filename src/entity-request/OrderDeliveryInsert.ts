import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import CoreEntity from '../core/entity/CoreEntity';
import { Property } from "@tsed/common";
import { Driver } from '../entity/Driver';
import { OrderFood } from "../entity/OrderFood";
import { Customer } from "../entity/Customer";
import { OrderDelivery } from "../entity/OrderDelivery";

export class OrderDeliveryInsert {
    toOrderDeliver(customer: Customer): OrderDelivery {
        let orderDelivery = new OrderDelivery()
        orderDelivery.detail = this.detail
        orderDelivery.phone = this.phone
        orderDelivery.customer = customer
        orderDelivery.distance = this.distance
        orderDelivery.encourageFee = this.encourageFee || 0
        orderDelivery.startAddress = this.startAddress
        orderDelivery.startLong = this.startLong
        orderDelivery.startLat = this.startLat
        orderDelivery.endAddress = this.endAddress
        orderDelivery.endLong = this.endLong
        orderDelivery.endLat = this.endLat
        orderDelivery.receiverName = this.receiverName
        orderDelivery.receiverPhone = this.receiverPhone
        orderDelivery.matrix = this.matrix
        orderDelivery.duration = this.duration

        return orderDelivery
    }

    // PROPERTIES

    @Property()
    detail: string

    @Property()
    phone: string

    @Property()
    receiverName: string

    @Property()
    receiverPhone: string

    @Property()
    distance: number

    @Property()
    matrix: string

    @Property()
    duration: number

    @Property()
    encourageFee: number

    @Property()
    startAddress: string

    @Property()
    startLong: number

    @Property()
    startLat: number

    @Property()
    endAddress: string

    @Property()
    endLong: number

    @Property()
    endLat: number

}
