import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany } from "typeorm";
import { Property } from "@tsed/common";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Store } from "./Store";
import { Food } from "./Food";

@Entity(addPrefix("menu_food"))
export class MenuFood extends CoreEntity {
    constructor() {
        super()
    }


    // PROPERTIES

    @Column({ default: false, select: false })
    @Property()
    isDeleted: boolean

    @Column({ default: '' })
    @Property()
    name: string

    @PrimaryGeneratedColumn()
    id: number;


    // RELATIONS

    @OneToMany(type => Food, foods => foods.menuFood)
    foods: Food[];

    @ManyToOne(type => Store, store => store.menuFoods)
    store: Store;


    // METHODS


} // END FILE
