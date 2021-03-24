import { Entity, PrimaryGeneratedColumn, Column, OneToOne, ManyToOne, OneToMany } from "typeorm";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Property } from "@tsed/common";
import { OrderFoodDetail } from './OrderFoodDetail';
import { Store } from "./Store";
import { RequestFood } from "./RequestFood";
import { MenuFood } from "./MenuFood";
import { FoodGallery } from "./FoodGallery";

@Entity(addPrefix("food"))
export class Food extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES

    @Column({ default: 0 })
    @Property()
    position: number

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @Property()
    name: string

    @Column({ default: '' })
    @Property()
    ingredient: string

    @Column()
    @Property()
    thumbnail: string

    @Column({ default: 0 })
    @Property()
    originPrice: number

    @Column({ default: 0 })
    @Property()
    finalPrice: number

    @Column({ default: true })
    @Property()
    isShow: boolean

    @Column({ default: false })
    @Property()
    isBlock: boolean

    @Column({ default: false, select: false })
    @Property()
    isDeleted: boolean


    // RELATIONS

    @ManyToOne(type => MenuFood, menuFood => menuFood.foods)
    menuFood: MenuFood;

    @OneToMany(type => RequestFood, requestUpdateFoods => requestUpdateFoods.food)
    requestUpdateFoods: RequestFood[];

    @ManyToOne(type => Store, store => store.foods)
    store: Store

    @OneToMany(type => OrderFoodDetail, orderFoodDetail => orderFoodDetail.food)
    orderFoodDetails: OrderFoodDetail

    @OneToMany(type => FoodGallery, foodGalleries => foodGalleries.food)
    foodGalleries: FoodGallery[];


    // METHODS


} // END FILE
