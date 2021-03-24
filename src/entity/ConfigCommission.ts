import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany } from "typeorm";
import { Property } from "@tsed/common";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Area } from "./Area";

export enum ConfigCommissionType {
    Transport = 'TRANSPORT',
    Food = 'FOOD',
    Delivery = 'DELIVERY'
}

@Entity(addPrefix("config_commission"))
export class ConfigCommission extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES

    @PrimaryGeneratedColumn()
    @Property()
    id: number;

    @Column({ default: '' })
    @Property()
    type: ConfigCommissionType

    @Column("double", { default: 0 })
    @Property()
    value: number


    // RELATIONS

    @ManyToOne(type => Area, area => area.configCommissions)
    area: Area;


    // METHODS

    public async assignArea(areaId: number) {
        const area = await Area.findOneOrThrowId(areaId, null, '')
        this.area = area
    }


} // END FILE
