import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Property, Minimum } from "@tsed/common";
import { Customer } from "./Customer";
import moment from "moment";
import md5 from "md5";
import { CODE_ORDER } from "../types/types";
import { OrderType, ORDER_TYPE } from "./OrderType";
import { Config } from "./Config";
import { CONFIG_PARAMS } from "../controllers/admin/ConfigController";
import { Driver } from "./Driver";
import { Area } from "./Area";
import { ConfigCommission } from "./ConfigCommission";
import { ConfigOrder } from "./ConfigOrder";

export enum OrderTransportStatus {
    waiting = 'WAITING',
    delivering = 'DELIVERING',
    complete = 'COMPLETE',
    cancel = 'CANCEL',
    noDelivery = 'NO_DELIVERY'
}

export enum OrderTransportType {
    Normal = 'NORMAL',
    Simple = 'SIMPLE'
}

@Entity(addPrefix("order_transport"))
export class OrderTransport extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES

    @Column({ default: OrderTransportType.Normal })
    @Property()
    type: string

    @Column({ default: '' })
    @Property()
    phone: string

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @Property()
    code: string;

    @Column({ type: "double" })
    @Property()
    distance: number

    @Column({ default: 0 })
    @Property()
    encourageFee: number

    // Start
    @Column({ type: "double" })
    @Property()
    startLong: number

    @Column({ type: "double" })
    @Property()
    startLat: number

    @Column({ default: "" })
    @Property()
    startAddress: string

    // End
    @Column({ type: "double" })
    @Property()
    endLong: number

    @Column({ type: "double" })
    @Property()
    endLat: number

    @Column({ default: "" })
    @Property()
    endAddress: string

    // Money
    @Column({ default: 0 })
    @Minimum(0)
    @Property()
    moneyDistance: number

    @Column({ default: 0 })
    @Minimum(0)
    @Property()
    moneyIncome: number

    @Column({ default: 0 })
    @Minimum(0)
    @Property()
    moneyFinal: number

    @Column({ nullable: true })
    @Property()
    note: string

    @Column({ default: OrderTransportStatus.waiting })
    @Property()
    status: string

    @Column("text", { nullable: true })
    @Property()
    matrix: string

    @Column({ default: 0 })
    @Property()
    duration: number

    // RELATIONS

    @ManyToOne(type => Customer, customer => customer.orderTransports)
    customer: Customer

    @ManyToOne(type => Driver, driver => driver.orderTransports)
    driver: Driver

    @ManyToOne(type => Area, area => area.orderTransports)
    area: Area;


    // METHODS

    public async assignArea(areaId: number) {
        const area = await Area.findOneOrThrowId(areaId, null, '')
        this.area = area
    }

    calculateMoneyDistance(configOrder: ConfigOrder, distance: number) {
        const { minPrice, kmMinPrice, pricePerKM } = configOrder
        let moneyDistance = 0
        if (distance <= kmMinPrice) {
            moneyDistance = minPrice
        } else {
            const differentDistance = Math.ceil(distance - kmMinPrice)
            moneyDistance = minPrice + differentDistance * pricePerKM
        }
        return moneyDistance
    }

    async calculateMoneyIncome(configCommission: ConfigCommission) {
        let moneyIncome = 0

        moneyIncome = this.moneyDistance * (100 - +configCommission.value) / 100
        return moneyIncome
    }

    async calculateMoney(configOrder: ConfigOrder, configCommission: ConfigCommission) {
        const moneyDistance = this.calculateMoneyDistance(configOrder, this.distance)

        this.moneyDistance = moneyDistance
        this.moneyFinal = moneyDistance
        this.moneyIncome = await this.calculateMoneyIncome(configCommission)
    }

    generateCode() {
        this.code = CODE_ORDER.transport +
            this.customer.id +
            md5(`${moment().valueOf()}`).substring(0, 6)
    }

} // END FILE
