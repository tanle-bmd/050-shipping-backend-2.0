import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany } from "typeorm";
import { Property } from "@tsed/common";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Store } from "./Store";
import { Area } from "./Area";

export enum BannerStoreType {
    Food = 'FOOD',
    Other = 'OTHER'
}

@Entity(addPrefix("banner_store"))
export class BannerStore extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES

    @Column()
    @Property()
    title: string

    @Column()
    @Property()
    thumbnail: string

    @Column('text')
    @Property()
    body: string

    @Column({ default: true })
    @Property()
    isShow: boolean

    @Column({ default: BannerStoreType.Food })
    @Property()
    type: BannerStoreType


    // RELATIONS

    @ManyToOne(type => Store, store => store.bannerStores)
    store: Store;

    @ManyToOne(type => Area, area => area.bannerStores)
    area: Area;


    // METHODS

    public async assignArea(areaId: number) {
        const area = await Area.findOneOrThrowId(areaId, null, '')
        this.area = area
    }

} // END FILE
