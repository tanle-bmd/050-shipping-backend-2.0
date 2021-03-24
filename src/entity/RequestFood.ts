import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany } from "typeorm";
import { Property } from "@tsed/common";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Food } from "./Food";
import { Store } from "./Store";

export enum RequestFoodType {
    Create = 'CREATE',
    Update = 'UPDATE'
}

export enum RequestFoodStatus {
    Pending = 'PENDING',
    Complete = 'COMPLETE'
}

@Entity(addPrefix("request_update_food"))
export class RequestFood extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES

    @Column({ default: RequestFoodStatus.Pending })
    @Property()
    status: string

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ default: RequestFoodType.Update })
    @Property()
    type: string

    @Column({ default: true })
    @Property()
    isShow: boolean

    @Column({ default: false })
    @Property()
    isBlock: boolean

    @Column({ default: 0 })
    @Property()
    finalPrice: number

    @Column({ default: 0 })
    @Property()
    originPrice: number

    @Column({ default: '' })
    @Property()
    thumbnail: string

    @Column({ default: '' })
    @Property()
    ingredient: string

    @Column({ default: '' })
    @Property()
    name: string

    // RELATIONS

    @ManyToOne(type => Store, store => store.requestUpdateFoods)
    store: Store;

    @ManyToOne(type => Food, food => food.requestUpdateFoods)
    food: Food;


    // METHODS


} // END FILE
