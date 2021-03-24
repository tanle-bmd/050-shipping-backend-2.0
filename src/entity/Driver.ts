import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from "typeorm";
import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Property, Minimum } from "@tsed/common";
import { OrderFood } from "./OrderFood";
import { OrderDelivery } from './OrderDelivery';
import { OrderTransport } from './OrderTransport';
import { Deposit } from "./Deposit";
import { Withdraw } from "./Withdraw";
import { Area } from "./Area";

export enum STATUS_DRIVER {
    free = "FREE",
    busy = 'BUSY'
}

@Entity(addPrefix("driver"))
export class Driver extends CoreEntity {
    constructor() {
        super()
    }

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    @Property()
    phone: string

    @Column({ default: 0, width: 20 })
    @Property()
    balance: number;

    @Column({ nullable: true })
    @Property()
    username: string

    @Column({ select: false })
    password: string;

    @Column({ nullable: true })
    @Property()
    dayOfBirth: string;

    @Column({ nullable: true })
    @Property()
    licensePlate: string;

    @Column({ nullable: true })
    @Property()
    name: string;

    @Column({ nullable: true })
    @Property()
    nickname: string;

    @Column({ nullable: true })
    @Property()
    avatar: string;

    @Column({ default: STATUS_DRIVER.free })
    @Property()
    status: string;

    @Column({ default: false })
    @Property()
    isBlock: boolean

    @Column({ nullable: true })
    @Property()
    expoToken: string;

    @Column({ default: false, select: false })
    @Property()
    isDeleted: boolean


    // RELATIONS
    @OneToMany(type => OrderFood, orderFood => orderFood.driver)
    orderFoods: OrderFood[];

    @OneToMany(type => OrderDelivery, orderDelivery => orderDelivery.driver)
    orderDeliveries: OrderDelivery[];

    @OneToMany(type => OrderTransport, orderTransport => orderTransport.driver)
    orderTransports: OrderTransport[];

    @OneToMany(type => Deposit, deposit => deposit.driver)
    deposits: Deposit[];

    @OneToMany(type => Withdraw, withdraw => withdraw.driver)
    withdraws: Withdraw[];

    @ManyToOne(type => Area, area => area.drivers)
    area: Area;


    // METHODS

    public async assignArea(areaId: number) {
        const area = await Area.findOneOrThrowId(areaId, null, '')
        this.area = area
    }

} // END FILE