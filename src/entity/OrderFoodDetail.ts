import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne } from "typeorm";
import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Property } from "@tsed/common";
import { OrderFood } from "./OrderFood";
import { Food } from './Food';

@Entity(addPrefix("order_food_detail"))
export class OrderFoodDetail extends CoreEntity {
    constructor() {
        super()
    }

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @Property()
    originPrice: number

    @Column()
    @Property()
    finalPrice: number

    @Column()
    @Property()
    amount: number

    @ManyToOne(type => OrderFood, orderFood => orderFood.details)
    order: OrderFood

    @ManyToOne(type => Food, food => food.orderFoodDetails)
    food: Food;
}
