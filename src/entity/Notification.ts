import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Property } from "@tsed/common";
import { Area } from "./Area";

@Entity(addPrefix("notification"))
export class Notification extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @Property()
    thumbnail: string

    @Column()
    @Property()
    title: string

    @Column()
    @Property()
    content: string

    @Column({ default: false })
    @Property()
    isBlock: boolean

    // RELATIONS

    @ManyToOne(type => Area, area => area.notifications)
    area: Area;


    // METHODS

    public async assignArea(areaId: number) {
        const area = await Area.findOneOrThrowId(areaId, null, '')
        this.area = area
    }

} // END FILE
