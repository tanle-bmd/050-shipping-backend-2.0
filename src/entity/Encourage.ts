import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Property } from "@tsed/common";

@Entity(addPrefix("encourage"))
export class Encourage extends CoreEntity {
    constructor() {
        super()
    }

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @Property()
    money: number

}
