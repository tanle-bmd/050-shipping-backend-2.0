import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Property } from "@tsed/common";

export enum PARAMS {
    commissionFood = 'COMMISSION_FOOD',
    commissionDelivery = 'COMMISSION_DELIVERY',
    commissionTransport = 'COMMISSION_TRANSPORT'
}

@Entity(addPrefix("config"))
export class Config extends CoreEntity {
    constructor() {
        super()
    }

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @Property()
    param: string

    @Column()
    @Property()
    value: string;

    @Column({ default: '' })
    @Property()
    note: string

}
