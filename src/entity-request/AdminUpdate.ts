import { Column } from "typeorm";
import { Property, Default } from "@tsed/common";
import { Staff } from '../entity/Staff';

export class AdminUpdate {
    toAdmin(): Staff {
        let admin = new Staff()
        admin.name = this.name
        admin.avatar = this.avatar
        admin.phone = this.phone
        admin.email = this.email
        admin.isBlock = this.isBlock
        return admin
    }

    @Property()
    name: string;

    @Property()
    avatar: string;

    @Property()
    phone: string;

    @Property()
    email: string;

    @Property()
    isBlock: boolean;
}
