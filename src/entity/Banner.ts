// IMPORT LIBRARY
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany } from "typeorm";
import { Property } from "@tsed/common";

// IMPORT CUSTOM
import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Store } from "./Store";
import { Area } from "./Area";

@Entity(addPrefix("banner"))
export class Banner extends CoreEntity {
    constructor() {
        super()
    }

    @Column()
    @Property()
    title: string

    @Column({ nullable: true })
    @Property()
    phone: string

    @Column()
    @Property()
    thumbnail: string

    @Column('text')
    @Property()
    body: string

    @Column({ default: true })
    @Property()
    isShow: boolean

    // RELATIONS

    @ManyToOne(type => Area, area => area.banners)
    area: Area;


    // METHODS

    public async assignArea(areaId: number) {
        const area = await Area.findOneOrThrowId(areaId, null, '')
        this.area = area
    }

} // END FILE
