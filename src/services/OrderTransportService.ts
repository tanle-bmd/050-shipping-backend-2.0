import { Service } from "@tsed/common";
import { Exception } from "ts-httpexceptions";

import { CoreService } from "../core/services/CoreService";
import { ConfigCommission } from "../entity/ConfigCommission";

import { OrderTransport, OrderTransportStatus } from "../entity/OrderTransport";
import { getFromToDate } from "../util/helper";

@Service()
export class OrderTransportService extends CoreService {
    async getManyAndCount({ search, page, limit, from, to, status, areaId }) {
        const { start, end } = getFromToDate(from, to)

        let where = `CONCAT( orderTransport.code, ' ', customer.name, ' ', ifnull(driver.name, ''), ' ', customer.phone, ' ', ifnull(driver.phone, ''))
        LIKE '%${search}%'`;

        if (start && end) {
            where += ` AND orderTransport.dateCreated BETWEEN ${start} AND ${end}`
        }

        if (status) {
            where += ` AND orderTransport.status LIKE '%${status}%'`
        }

        if (areaId) {
            where += ` AND area.id = ${areaId}`
        }

        const [orderTransports, total] = await OrderTransport.createQueryBuilder('orderTransport')
            .leftJoinAndSelect('orderTransport.area', 'area')
            .skip((page - 1) * limit)
            .take(limit)
            .where(where)
            .leftJoinAndSelect('orderTransport.customer', 'customer')
            .leftJoinAndSelect('orderTransport.driver', 'driver')
            .orderBy('orderTransport.id', 'DESC')
            .getManyAndCount()

        const orderFoodDate = await OrderTransport.createQueryBuilder('orderTransport')
            .leftJoinAndSelect('orderTransport.area', 'area')
            .where(where)
            .leftJoinAndSelect('orderTransport.customer', 'customer')
            .leftJoinAndSelect('orderTransport.driver', 'driver')
            .orderBy('orderTransport.id', 'DESC')
            .getMany()

        const totalIncome = orderFoodDate.reduce((acc, order) => acc + order.moneyIncome, 0)
        const totalRevenue = orderFoodDate.reduce((acc, order) => acc + (order.moneyDistance - order.moneyIncome), 0)
        const totalMoneyTotal = orderFoodDate.reduce((acc, order) => acc + order.moneyFinal, 0)

        return { orderTransports, total, totalIncome, totalRevenue, totalMoneyTotal }
    }

    public async updateMoney(order: OrderTransport, money: number, configCommission: ConfigCommission) {
        order.moneyDistance = money
        order.moneyFinal = money
        order.moneyIncome = await order.calculateMoneyIncome(configCommission)

        await order.save()
    }

    public async getTotalNotComplete(customerId: number) {
        const statusesNotComplete = [
            OrderTransportStatus.complete,
            OrderTransportStatus.cancel,
            OrderTransportStatus.noDelivery
        ]
        let where = `orderTransport.status NOT IN (:...statusesNotComplete) 
        AND customer.id = ${customerId}`
        const orderNotComplete = await OrderTransport.createQueryBuilder('orderTransport')
            .leftJoinAndSelect('orderTransport.customer', 'customer')
            .where(where, { statusesNotComplete })
            .orderBy('orderTransport.id', 'DESC')
            .getCount()

        return orderNotComplete
    }
}
