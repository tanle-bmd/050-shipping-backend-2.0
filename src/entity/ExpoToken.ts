import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Property } from "@tsed/common";

@Entity(addPrefix("expo_token"))
export class ExpoToken extends CoreEntity {
    constructor() {
        super()
    }

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @Property()
    driverId: number

    @Column()
    @Property()
    token: string

}
