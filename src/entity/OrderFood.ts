import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Property, Minimum } from "@tsed/common";
import { Store } from "./Store";
import { Customer } from './Customer';
import { OrderFoodDetail } from './OrderFoodDetail';
import { Driver } from "./Driver";
import { Config } from './Config';
import { OrderType, ORDER_TYPE } from "./OrderType";
import { CODE_ORDER } from "../types/types";
import moment from "moment";
import md5 from "md5";
import { CONFIG_PARAMS } from "../controllers/admin/ConfigController";
import { Area } from "./Area";
import { ConfigCommission } from "./ConfigCommission";
import { ConfigOrder } from "./ConfigOrder";

export enum OrderFoodStatus {
    waiting = 'WAITING',
    delivering = 'DELIVERING',
    complete = 'COMPLETE',
    done = 'DONE',
    cancel = 'CANCEL',
    noDelivery = 'NO_DELIVERY'
}

@Entity(addPrefix("order_food"))
export class OrderFood extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES

    @Column({ default: '' })
    @Property()
    phone: string

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @Property()
    code: string

    @Column({ nullable: true })
    @Property()
    startAddress: string

    @Column({ default: 0 })
    @Property()
    distance: number

    @Column({ default: 0 })
    @Property()
    encourageFee: number

    @Column({ type: "double", default: 0 })
    @Property()
    startLong: number

    @Column({ type: "double", default: 0 })
    @Property()
    startLat: number

    // Money distance
    @Column({ default: 0 })
    @Minimum(0)
    @Property()
    moneyDistance: number

    // Money distance
    @Column({ default: 0 })
    @Minimum(0)
    @Property()
    moneyIncome: number

    // Total money foods
    @Column({ default: 0 })
    @Minimum(0)
    @Property()
    moneyTotal: number

    @Column({ default: 0 })
    @Minimum(0)
    @Property()
    moneyFinal: number

    @Column({ nullable: true })
    @Property()
    note: string

    @Column("text", { nullable: true })
    @Property()
    matrix: string

    @Column({ default: 0 })
    @Property()
    duration: number

    @Column({ default: OrderFoodStatus.waiting })
    @Property()
    status: string

    // RELATIONS

    @ManyToOne(type => Store, store => store.orders)
    store: Store;

    @ManyToOne(type => Customer, customer => customer.orderFoods)
    customer: Customer;

    @ManyToOne(type => Driver, driver => driver.orderFoods)
    driver: Driver

    @OneToMany(type => OrderFoodDetail, orderFoodDetail => orderFoodDetail.order)
    details: OrderFoodDetail[];

    @ManyToOne(type => Area, area => area.orderFoods)
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


    calculateMoneyTotal() {
        return this.details.reduce((sum: number, detail: OrderFoodDetail) => {
            return sum += detail.amount * detail.finalPrice
        }, 0)
    }

    async calculateMoney(configOrder: ConfigOrder, configCommission: ConfigCommission) {
        this.moneyDistance = this.calculateMoneyDistance(configOrder, this.distance)
        this.moneyTotal = this.calculateMoneyTotal()
        this.moneyFinal = this.moneyDistance + this.moneyTotal
        this.moneyIncome = this.moneyDistance * (100 - +configCommission.value) / 100
    }

    generateCode() {
        this.code = CODE_ORDER.food +
            this.customer.id +
            md5(`${moment().valueOf()}`).substring(0, 6)
    }

    public async assignArea(areaId: number) {
        const area = await Area.findOneOrThrowId(areaId, null, '')
        this.area = area
    }

} // END FILE
