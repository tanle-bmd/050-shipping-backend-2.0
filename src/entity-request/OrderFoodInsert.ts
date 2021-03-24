import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import CoreEntity from '../core/entity/CoreEntity';
import { Property } from "@tsed/common";
import { Driver } from '../entity/Driver';
import { OrderFood } from "../entity/OrderFood";
import { Customer } from "../entity/Customer";
import { BadRequest } from "ts-httpexceptions";

export class OrderFoodInsert {
    toOrderFood(customer: Customer): OrderFood {
        let orderFood = new OrderFood()
        orderFood.phone = this.phone
        orderFood.customer = customer
        orderFood.distance = this.distance
        orderFood.encourageFee = this.encourageFee || 0
        orderFood.startAddress = this.startAddress
        orderFood.note = this.note
        orderFood.startLat = this.startLat
        orderFood.startLong = this.startLong
        orderFood.matrix = this.matrix
        orderFood.duration = this.duration
        return orderFood
    }

    // PROPERTIES

    @Property()
    phone: string

    @Property()
    duration: number

    @Property()
    startAddress: string

    @Property()
    distance: number

    @Property()
    note: string

    @Property()
    encourageFee: number

    @Property()
    startLong: number

    @Property()
    startLat: number

    @Property()
    matrix: string

}
