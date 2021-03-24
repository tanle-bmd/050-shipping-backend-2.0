import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Property, Minimum } from "@tsed/common";
import { Customer } from "./Customer";
import { Driver } from "./Driver";
import { OrderDeliveryDetail } from './OrderDeliveryDetail';
import { OrderType, ORDER_TYPE } from "./OrderType";
import { CODE_ORDER } from "../types/types";
import moment from "moment";
import md5 from "md5";
import { Config } from "./Config";
import { CONFIG_PARAMS } from "../controllers/admin/ConfigController";
import { Area } from "./Area";
import { ConfigOrder } from "./ConfigOrder";
import { ConfigCommission } from "./ConfigCommission";

export enum OrderDeliveryStatus {
    waiting = 'WAITING',
    delivering = 'DELIVERING',
    complete = 'COMPLETE',
    done = 'DONE',
    cancel = 'CANCEL',
    noDelivery = 'NO_DELIVERY'
}

export enum OrderDeliveryType {
    Normal = 'NORMAL',
    Simple = 'SIMPLE'
}

@Entity(addPrefix("order_delivery"))
export class OrderDelivery extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES

    @Column({ default: '' })
    @Property()
    detail: string

    @Column({ default: OrderDeliveryType.Normal })
    @Property()
    type: string

    @Column({ default: '' })
    @Property()
    phone: string

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @Property()
    code: string

    @Column({ default: "" })
    @Property()
    receiverName: string

    @Column({ default: "" })
    @Property()
    receiverPhone: string

    @Column({ default: 0 })
    @Property()
    encourageFee: number

    @Column({ default: 0 })
    @Property()
    distance: number

    @Column({ default: 0 })
    @Property()
    duration: number

    @Column("text", { nullable: true })
    @Property()
    matrix: string

    // Start
    @Column({ nullable: true })
    @Property()
    startAddress: string

    @Column({ type: "double", default: 0 })
    @Property()
    startLong: number

    @Column({ type: "double", default: 0 })
    @Property()
    startLat: number

    // End
    @Column({ nullable: true })
    @Property()
    endAddress: string

    @Column({ type: "double", default: 0 })
    @Property()
    endLong: number

    @Column({ type: "double", default: 0 })
    @Property()
    endLat: number

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

    @Column({ default: OrderDeliveryStatus.waiting })
    @Property()
    status: string

    // RELATIONS
    @ManyToOne(type => Customer, customer => customer.orderFoods)
    customer: Customer;

    @ManyToOne(type => Driver, driver => driver.orderDeliveries)
    driver: Driver

    @OneToMany(type => OrderDeliveryDetail, orderDeliveryDetail => orderDeliveryDetail.order)
    details: OrderDeliveryDetail[];

    @ManyToOne(type => Area, area => area.orderDeliveries)
    area: Area;


    // METHODS

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

        // const commissionDelivery = await Config.findOneOrThrowOption({
        //     where: { param: CONFIG_PARAMS.commissionDelivery }
        // })

        moneyIncome = this.moneyDistance * (100 - +configCommission.value) / 100

        return moneyIncome
    }

    async calculateMoney(configOrder: ConfigOrder, configCommission: ConfigCommission) {
        const moneyDistance = this.calculateMoneyDistance(configOrder, this.distance)

        this.moneyDistance = moneyDistance
        this.moneyFinal = moneyDistance
        this.moneyIncome = await this.calculateMoneyIncome(configCommission)
    }

    // generateCode
    generateCode() {
        this.code = CODE_ORDER.delivery +
            this.customer.id +
            md5(`${moment().valueOf()}`).substring(0, 6)
    }

    public async assignArea(areaId: number) {
        const area = await Area.findOneOrThrowId(areaId, null, '')
        this.area = area
    }

} // END FILE
