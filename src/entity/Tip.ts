import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany } from "typeorm";
import { Property } from "@tsed/common";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Area } from "./Area";

@Entity(addPrefix("tip"))
export class Tip extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES

    @PrimaryGeneratedColumn()
    id: number;

    @Column("double", { default: 0 })
    @Property()
    money: number

    @Column({ default: false, select: false })
    @Property()
    isDeleted: boolean


    // RELATIONS

    @ManyToOne(type => Area, area => area.tips)
    area: Area;


    // METHODS

    public async assignArea(areaId: number) {
        const area = await Area.findOneOrThrowId(areaId, null, '')
        this.area = area
    }


} // END FILE
