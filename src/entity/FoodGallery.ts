import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany } from "typeorm";
import { Property } from "@tsed/common";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Food } from "./Food";

@Entity(addPrefix("food_gallery"))
export class FoodGallery extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES

    @Column({ default: '' })
    @Property()
    thumbnail: string


    // RELATIONS

    @ManyToOne(type => Food, food => food.foodGalleries)
    food: Food;


    // METHODS


} // END FILE
