import { Entity, PrimaryGeneratedColumn, Column, Unique, ManyToOne, OneToMany, ManyToMany, JoinTable } from "typeorm";
import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Property } from "@tsed/common";
import { Role } from "./Role";

@Entity(addPrefix("permission"))
export class Permission extends CoreEntity {
    constructor() {
        super()
    }

    @PrimaryGeneratedColumn()
    @Property()
    id: number;

    @Column()
    @Property()
    path: string;

    @ManyToMany(type => Role, role => role.permissions)
    @JoinTable()
    roles: Role[]
}
