import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from "typeorm";
import { Property } from "@tsed/common";

import CoreEntity from '../core/entity/CoreEntity';

import { addPrefix } from "../util/helper"
import { TYPE_GENDER } from "../types/types";
import { OrderFood } from './OrderFood';
import { OrderTransport } from './OrderTransport';
import { Address } from './Address';
import { Area } from "./Area";

@Entity(addPrefix("customer"))
export class Customer extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES

    @Column({ default: false })
    @Property()
    isDeveloper: boolean

    @Column({ default: '' })
    @Property()
    deviceId: string

    @Column({ default: '' })
    @Property()
    forgotCode: string

    @Column()
    @Property()
    phone: string

    @Column({ select: false })
    password: string;

    @Column({ default: '' })
    @Property()
    email: string

    @Column({ nullable: true })
    @Property()
    dayOfBirth: string;

    @Column({ default: TYPE_GENDER.male })
    @Property()
    gender: string

    @Column()
    @Property()
    name: string;

    @Column({ nullable: true })
    @Property()
    avatar: string;

    @Column({ nullable: true })
    @Property()
    expoToken: string;

    @Column({ default: false })
    @Property()
    isBlock: boolean


    // RELATIONS

    @OneToMany(type => OrderTransport, orderTransport => orderTransport.customer)
    orderTransports: OrderTransport[];

    @OneToMany(type => OrderFood, orderFood => orderFood.customer)
    orderFoods: OrderFood[];

    @OneToMany(type => Address, address => address.customer)
    addresses: Address[];

    @ManyToOne(type => Area, area => area.customers)
    area: Area;


    // METHODS

    public async assignArea(areaId: number) {
        const area = await Area.findOneOrThrowId(areaId, null, '')
        this.area = area
    }

} // END FILE
