import { Property } from "@tsed/common";
import { Customer } from "../entity/Customer";
import { OrderDelivery } from "../entity/OrderDelivery";
import { OrderTransport } from '../entity/OrderTransport';

export class OrderTransportInsert {
    toOrderTransport(customer: Customer): OrderTransport {
        let orderTransport = new OrderTransport()
        orderTransport.phone = this.phone
        orderTransport.customer = customer
        orderTransport.distance = this.distance
        orderTransport.encourageFee = this.encourageFee || 0
        orderTransport.startLong = this.startLong
        orderTransport.startLat = this.startLat
        orderTransport.startAddress = this.startAddress
        orderTransport.endLong = this.endLong
        orderTransport.endLat = this.endLat
        orderTransport.endAddress = this.endAddress
        orderTransport.note = this.note
        orderTransport.matrix = this.matrix
        orderTransport.duration = this.duration
        return orderTransport
    }

    // PROPERTIES

    @Property()
    phone: string

    @Property()
    duration: number

    @Property()
    distance: number

    @Property()
    encourageFee: number

    @Property()
    startLong: number

    @Property()
    startLat: number

    @Property()
    note: string

    @Property()
    startAddress: string

    @Property()
    endLong: number

    @Property()
    endLat: number

    @Property()
    endAddress: string

    @Property()
    matrix: string
}
