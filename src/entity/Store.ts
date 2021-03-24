import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from "typeorm";
import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Property } from "@tsed/common";
import { OrderFood } from "./OrderFood";
import { Food } from './Food';
import { BannerStore } from "./BannerStore";
import { RequestFood } from "./RequestFood";
import { MenuFood } from "./MenuFood";
import { Banner } from "./Banner";
import { Area } from "./Area";

export enum StoreType {
    Food = 'FOOD',
    Other = 'OTHER'
}

@Entity(addPrefix("store"))
export class Store extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES

    @Column({ default: '' })
    @Property()
    note: string

    @Column({ default: '' })
    @Property()
    username: string

    @Column({ default: '', select: false })
    @Property()
    password: string

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @Property()
    name: string

    @Column()
    @Property()
    address: string

    @Column({ nullable: true })
    @Property()
    phone: string

    @Column({ type: "double" })
    @Property()
    lat: number

    @Column({ type: "double" })
    @Property()
    long: number

    @Column({ default: '' })
    @Property()
    openTime: string

    @Column({ default: '' })
    @Property()
    closeTime: string

    @Column({ default: '' })
    @Property()
    openTime2: string

    @Column({ default: '' })
    @Property()
    closeTime2: string

    @Column({ nullable: true })
    @Property()
    thumbnail: string

    @Column({ default: StoreType.Food })
    @Property()
    type: string

    @Column({ default: false })
    @Property()
    isBlock: boolean

    @Column({ default: false })
    @Property()
    isClosed: boolean

    @Column({ default: false, select: false })
    @Property()
    isDeleted: boolean


    // RELATIONS

    @OneToMany(type => MenuFood, menuFoods => menuFoods.store)
    menuFoods: MenuFood[];

    @OneToMany(type => RequestFood, requestUpdateFoods => requestUpdateFoods.store)
    requestUpdateFoods: RequestFood[];

    @OneToMany(type => BannerStore, bannerStores => bannerStores.store)
    bannerStores: BannerStore[];

    @OneToMany(() => OrderFood, orderFood => orderFood.store)
    orders: OrderFood[]

    @OneToMany(() => Food, food => food.store)
    foods: Food[]

    @ManyToOne(type => Area, area => area.stores)
    area: Area;


    // METHODS

    public async assignArea(areaId: number) {
        const area = await Area.findOneOrThrowId(areaId, null, '')
        this.area = area
    }

} // END FILE
