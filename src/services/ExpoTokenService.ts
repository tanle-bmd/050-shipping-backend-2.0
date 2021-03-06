import { STATUS_DRIVER } from '../entity/Driver';
// IMPORT LIBRARY
import { Service } from "@tsed/common";

// IMPORT CUSTOM
import { CoreService } from "../core/services/CoreService";
import { ExpoToken } from '../entity/ExpoToken'
import { OrderFood, OrderFoodStatus } from "../entity/OrderFood";
import { pushNotification } from "../util/expo";
import { TYPE_ORDER } from "../types/types";
import { OrderDelivery } from "../entity/OrderDelivery";
import { OrderTransport, OrderTransportStatus } from "../entity/OrderTransport";
import { Driver } from "../entity/Driver";
import { Notification } from '../entity/Notification';
import { Customer } from '../entity/Customer';

@Service()
export class ExpoTokenService extends CoreService {
    public async pushNotificationDrivers(notification: Notification) {
        const { title, content, area } = notification

        let where = `driver.expoToken <> ''
        AND area.id = ${area.id}`
        const drivers = await Driver.createQueryBuilder('driver')
            .leftJoinAndSelect('driver.area', 'area')
            .where(where)
            .orderBy('driver.id', 'DESC')
            .getMany()

        const tokens = drivers.map(d => d.expoToken).filter(Boolean)

        const data = {
            type: 'NOTIFICATION',
            title
        }

        pushNotification(tokens, title, content, data)
    }

    public async pushNotificationCustomers(notification: Notification) {
        const { title, content, area } = notification

        let where = `customer.expoToken <> ''
        AND area.id = ${area.id}`
        const customers = await Customer.createQueryBuilder('customer')
            .leftJoinAndSelect('customer.area', 'area')
            .where(where)
            .orderBy('customer.id', 'DESC')
            .getMany()

        const tokens = customers.map(d => d.expoToken).filter(Boolean)

        const data = {
            type: 'NOTIFICATION',
            title
        }

        pushNotification(tokens, title, content, data)
    }

    public async sentNotification(title: string, body: string, data: any) {
        let where = `driver.status = '${STATUS_DRIVER.free}'
        AND driver.expoToken <> ''`
        const drivers = await Driver.createQueryBuilder('driver')
            .where(where)
            .orderBy('driver.id', 'DESC')
            .getMany()

        const tokens = drivers.map(d => d.expoToken).filter(Boolean)
        const tokensValid = tokens.filter(Boolean)
        pushNotification(tokensValid, title, body, data)
    }

    public async sentNotificationOrderFood(orderFood: OrderFood) {
        const title = 'C?? ????n h??ng ??n u???ng m???i'
        const body = `Qu??n: ${orderFood.store.name}\n ?????a ch??? qu??n:  ${orderFood.store.address}`
        const data = {
            type: TYPE_ORDER.food,
            order: orderFood,
            title,
            body
        }
        this.sentNotification(title, body, data)
    }

    public async sentNotificationOrderDelivery(orderDelivery: OrderDelivery) {
        const title = 'C?? ????n h??ng chuy???n h??ng m???i'
        const body = `G???i ?????n: ${orderDelivery.endAddress}`
        const data = {
            type: TYPE_ORDER.delivery,
            order: orderDelivery,
            title,
            body
        }
        this.sentNotification(title, body, data)
    }

    public async sentNotificationOrderTransport(orderTransport: OrderTransport) {
        const title = 'C?? cu???c xe ??m m???i'
        const body = `????n ???: ${orderTransport.startAddress}\n ????a ?????n: ${orderTransport.endAddress}`
        const data = {
            type: TYPE_ORDER.delivery,
            order: orderTransport,
            title,
            body
        }
        this.sentNotification(title, body, data)
    }

    public async sendNotificationCustomer(token: string, title: string, body: string, data: any) {
        pushNotification([token], title, body, data)
    }

    public async sendNotificationCustomerOrderFood(order: OrderFood) {
        let title = ''
        let body = ''

        switch (order.status) {
            case OrderFoodStatus.delivering:
                title = '????n h??ng th???c ??n c???a b???n ???? ???????c nh???n.'
                body = `????n h??ng th???c ??n c???a b???n ???? ???????c t??i x??? ${order.driver.name} nh???n.`
                break;

            case OrderFoodStatus.noDelivery:
                title = '????n h??ng th???c ??n c???a b???n kh??ng ???????c giao.'
                body = `R???t ti???c v?? s??? b???t ti???n n??y.`
                break;

            default:
                title = `????n h??ng th???c ??n c???a b???n ???? ???????c t??i x??? ${order.driver.name} giao ho??n t???t.`
                body = `C??m ??n qu?? kh??ch ???? s??? d???ng d???ch v??? c???a shipping.`
                break;
        }

        const data = {
            type: TYPE_ORDER.food,
            order: order,
            title,
            body
        }
        this.sendNotificationCustomer(order.customer.expoToken, title, body, data)
    }

    public async sendNotificationCustomerOrderTransport(order: OrderTransport) {
        let title = ''
        let body = ''

        switch (order.status) {
            case OrderFoodStatus.delivering:
                title = 'Cu???c xe ??m c???a b???n ???? ???????c nh???n.'
                body = `Cu???c xe ??m c???a b???n ???? ???????c t??i x??? ${order.driver.name} nh???n.`
                break;

            case OrderFoodStatus.noDelivery:
                title = 'Cu???c xe ??m c???a b???n kh??ng ???????c giao.'
                body = `R???t ti???c v?? s??? b???t ti???n n??y.`
                break;

            default:
                title = `Cu???c xe ??m c???a b???n ???? ???????c t??i x??? ${order.driver.name} giao ho??n t???t.`
                body = `C??m ??n qu?? kh??ch ???? s??? d???ng d???ch v??? c???a shipping.`
                break;
        }

        const data = {
            type: TYPE_ORDER.transport,
            order: order,
            title,
            body
        }
        this.sendNotificationCustomer(order.customer.expoToken, title, body, data)
    }

    public async sendNotificationCustomerOrderDelivery(order: OrderDelivery) {
        let title = ''
        let body = ''

        switch (order.status) {
            case OrderFoodStatus.delivering:
                title = '????n h??ng giao h??ng c???a b???n ???? ???????c nh???n.'
                body = `????n h??ng giao h??ng c???a b???n ???? ???????c t??i x??? ${order.driver.name} nh???n.`
                break;

            case OrderFoodStatus.noDelivery:
                title = '????n h??ng giao h??ng c???a b???n kh??ng ???????c giao.'
                body = `R???t ti???c v?? s??? b???t ti???n n??y.`
                break;

            default:
                title = `????n h??ng giao h??ng c???a b???n ???? ???????c t??i x??? ${order.driver.name} giao ho??n t???t.`
                body = `C??m ??n qu?? kh??ch ???? s??? d???ng d???ch v??? c???a shipping.`
                break;
        }

        const data = {
            type: TYPE_ORDER.delivery,
            order: order,
            title,
            body
        }
        this.sendNotificationCustomer(order.customer.expoToken, title, body, data)
    }

}