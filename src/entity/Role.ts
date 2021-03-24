import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany } from "typeorm";
import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Property } from "@tsed/common";

import { Permission } from "./Permission";
import { Staff } from "./Staff";

export enum ROLE_DEFAULT {
    admin = 1
}

@Entity(addPrefix("role"))
export class Role extends CoreEntity {
    constructor() {
        super()
    }

    @PrimaryGeneratedColumn()
    @Property()
    id: number;

    @Column()
    @Property()
    name: string;

    @Column()
    @Property()
    description: string

    @OneToMany(() => Staff, admin => admin.role)
    admins: Staff[]

    @ManyToMany(() => Permission, permission => permission.roles)
    permissions: Permission[]

    // RELATIONS

}
