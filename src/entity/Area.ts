import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany } from "typeorm";
import { Property } from "@tsed/common";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Customer } from "./Customer";
import { Driver } from "./Driver";
import { OrderFood } from "./OrderFood";
import { OrderDelivery } from "./OrderDelivery";
import { OrderTransport } from "./OrderTransport";
import { Store } from "./Store";
import { Staff } from "./Staff";
import { Banner } from "./Banner";
import { BannerStore } from "./BannerStore";
import { Notification } from "./Notification";
import { ConfigOrder } from "./ConfigOrder";
import { ConfigCommission } from "./ConfigCommission";
import { Tip } from "./Tip";

@Entity(addPrefix("area"))
export class Area extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES

    @Column({ default: '' })
    @Property()
    name: string

    @Column({ default: false, select: false })
    @Property()
    isDeleted: boolean


    // RELATIONS

    @OneToMany(type => Customer, customers => customers.area)
    customers: Customer[];

    @OneToMany(type => Driver, drivers => drivers.area)
    drivers: Driver[];

    @OneToMany(type => OrderFood, orderFoods => orderFoods.area)
    orderFoods: OrderFood[];

    @OneToMany(type => OrderDelivery, orderDeliveries => orderDeliveries.area)
    orderDeliveries: OrderDelivery[];

    @OneToMany(type => OrderTransport, orderTransports => orderTransports.area)
    orderTransports: OrderTransport[];

    @OneToMany(type => Store, stores => stores.area)
    stores: Store[];

    @OneToMany(type => Staff, staffs => staffs.area)
    staffs: Staff[];

    @OneToMany(type => Banner, banners => banners.area)
    banners: Banner[];

    @OneToMany(type => BannerStore, bannerStores => bannerStores.area)
    bannerStores: BannerStore[];

    @OneToMany(type => Notification, notifications => notifications.area)
    notifications: Notification[];

    @OneToMany(type => ConfigOrder, configOrders => configOrders.area)
    configOrders: ConfigOrder[];

    @OneToMany(type => ConfigCommission, configCommissions => configCommissions.area)
    configCommissions: ConfigCommission[];

    @OneToMany(type => Tip, tips => tips.area)
    tips: Tip[];


    // METHODS


} // END FILE
