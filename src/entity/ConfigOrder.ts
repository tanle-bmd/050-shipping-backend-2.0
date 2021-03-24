import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany } from "typeorm";
import { Property } from "@tsed/common";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Area } from "./Area";

export enum ConfigOrderType {
    Transport = 'TRANSPORT',
    Food = 'FOOD',
    Delivery = 'DELIVERY'
}

@Entity(addPrefix("config_order"))
export class ConfigOrder extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES

    @PrimaryGeneratedColumn()
    @Property()
    id: number;

    @Column()
    @Property()
    type: ConfigOrderType

    @Column({ default: 0 })
    @Property()
    minPrice: number

    @Column({ default: 0 })
    @Property()
    kmMinPrice: number

    @Column({ default: 0 })
    @Property()
    pricePerKM: number


    // RELATIONS

    @ManyToOne(type => Area, area => area.configOrders)
    area: Area;

    public async assignArea(areaId: number) {
        const area = await Area.findOneOrThrowId(areaId, null, '')
        this.area = area
    }


    // METHODS


} // END FILE
