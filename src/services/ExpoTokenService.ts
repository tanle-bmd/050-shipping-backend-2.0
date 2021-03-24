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
        const title = 'Có đơn hàng ăn uống mới'
        const body = `Quán: ${orderFood.store.name}\n Địa chỉ quán:  ${orderFood.store.address}`
        const data = {
            type: TYPE_ORDER.food,
            order: orderFood,
            title,
            body
        }
        this.sentNotification(title, body, data)
    }

    public async sentNotificationOrderDelivery(orderDelivery: OrderDelivery) {
        const title = 'Có đơn hàng chuyển hàng mới'
        const body = `Gửi đến: ${orderDelivery.endAddress}`
        const data = {
            type: TYPE_ORDER.delivery,
            order: orderDelivery,
            title,
            body
        }
        this.sentNotification(title, body, data)
    }

    public async sentNotificationOrderTransport(orderTransport: OrderTransport) {
        const title = 'Có cuốc xe ôm mới'
        const body = `Đón ở: ${orderTransport.startAddress}\n Đưa đến: ${orderTransport.endAddress}`
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
                title = 'Đơn hàng thức ăn của bạn đã được nhận.'
                body = `Đơn hàng thức ăn của bạn đã được tài xế ${order.driver.name} nhận.`
                break;

            case OrderFoodStatus.noDelivery:
                title = 'Đơn hàng thức ăn của bạn không được giao.'
                body = `Rất tiếc vì sự bất tiện này.`
                break;

            default:
                title = `Đơn hàng thức ăn của bạn đã được tài xế ${order.driver.name} giao hoàn tất.`
                body = `Cám ơn quý khách đã sử dụng dịch vụ của shipping.`
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
                title = 'Cuốc xe ôm của bạn đã được nhận.'
                body = `Cuốc xe ôm của bạn đã được tài xế ${order.driver.name} nhận.`
                break;

            case OrderFoodStatus.noDelivery:
                title = 'Cuốc xe ôm của bạn không được giao.'
                body = `Rất tiếc vì sự bất tiện này.`
                break;

            default:
                title = `Cuốc xe ôm của bạn đã được tài xế ${order.driver.name} giao hoàn tất.`
                body = `Cám ơn quý khách đã sử dụng dịch vụ của shipping.`
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
                title = 'Đơn hàng giao hàng của bạn đã được nhận.'
                body = `Đơn hàng giao hàng của bạn đã được tài xế ${order.driver.name} nhận.`
                break;

            case OrderFoodStatus.noDelivery:
                title = 'Đơn hàng giao hàng của bạn không được giao.'
                body = `Rất tiếc vì sự bất tiện này.`
                break;

            default:
                title = `Đơn hàng giao hàng của bạn đã được tài xế ${order.driver.name} giao hoàn tất.`
                body = `Cám ơn quý khách đã sử dụng dịch vụ của shipping.`
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