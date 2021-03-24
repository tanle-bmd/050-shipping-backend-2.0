import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Property } from "@tsed/common";
import { Role } from "./Role";
import { Deposit } from "./Deposit";
import { Withdraw } from "./Withdraw";
import { Area } from "./Area";

@Entity(addPrefix("staff"))
export class Staff extends CoreEntity {
    constructor() {
        super()
    }

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @Property()
    username: string;

    @Column({ select: false })
    password: string;

    @Column()
    @Property()
    name: string;

    @Column({ default: "" })
    @Property()
    avatar: string;

    @Column()
    @Property()
    phone: string

    @Column()
    @Property()
    email: string

    @Column({ default: false })
    @Property()
    isBlock: boolean

    @ManyToOne(type => Role, role => role.admins)
    role: Role;

    @OneToMany(type => Deposit, deposit => deposit.creator)
    deposits: Deposit[];

    @OneToMany(type => Deposit, deposit => deposit.creator)
    withdraws: Withdraw[];

    @ManyToOne(type => Area, area => area.staffs)
    area: Area;


    // METHODS

    public async assignArea(areaId: number) {
        const area = await Area.findOneOrThrowId(areaId, null, '')
        this.area = area
    }

} // END FILE