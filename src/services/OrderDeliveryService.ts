import { Service } from "@tsed/common";
import { Exception } from "ts-httpexceptions";

import { CoreService } from "../core/services/CoreService";
import { ConfigCommission } from "../entity/ConfigCommission";

import { OrderDelivery, OrderDeliveryStatus } from "../entity/OrderDelivery";
import { getFromToDate } from "../util/helper";

@Service()
export class OrderDeliveryService extends CoreService {
    async getManyAndCount({ search, page, limit, from, to, status, areaId }) {
        const { start, end } = getFromToDate(from, to)

        let where = `CONCAT( orderDelivery.code, ' ', customer.name, ' ', ifnull(driver.name, ''), ' ', customer.phone, ' ', ifnull(driver.phone, ''))
        LIKE '%${search}%'`;

        if (start && end) {
            where += ` AND orderDelivery.dateCreated BETWEEN ${start} AND ${end}`
        }

        if (status) {
            where += ` AND orderDelivery.status LIKE '%${status}%'`
        }

        if (areaId) {
            where += ` AND area.id = ${areaId}`
        }

        const [orderDeliveries, total] = await OrderDelivery.createQueryBuilder('orderDelivery')
            .leftJoinAndSelect('orderDelivery.area', 'area')
            .skip((page - 1) * limit)
            .take(limit)
            .where(where)
            .leftJoinAndSelect('orderDelivery.customer', 'customer')
            .leftJoinAndSelect('orderDelivery.driver', 'driver')
            .leftJoinAndSelect('orderDelivery.details', 'details')
            .orderBy('orderDelivery.id', 'DESC')
            .getManyAndCount()

        const orderFoodDate = await OrderDelivery.createQueryBuilder('orderDelivery')
            .leftJoinAndSelect('orderDelivery.details', 'details')
            .leftJoinAndSelect('orderDelivery.customer', 'customer')
            .leftJoinAndSelect('orderDelivery.driver', 'driver')
            .leftJoinAndSelect('orderDelivery.area', 'area')
            .where(where)
            .orderBy('orderDelivery.id', 'DESC')
            .getMany()

        const totalIncome = orderFoodDate.reduce((acc, order) => acc + order.moneyIncome, 0)
        const totalRevenue = orderFoodDate.reduce((acc, order) => acc + (order.moneyDistance - order.moneyIncome), 0)
        const totalMoneyTotal = orderFoodDate.reduce((acc, order) => acc + order.moneyFinal, 0)

        return { orderDeliveries, total, totalIncome, totalRevenue, totalMoneyTotal }
    }

    public async updateMoney(order: OrderDelivery, money: number, configCommission: ConfigCommission) {
        order.moneyDistance = money
        order.moneyFinal = money
        order.moneyIncome = await order.calculateMoneyIncome(configCommission)

        await order.save()
    }


    public async getTotalNotComplete(customerId: number) {
        const statusesNotComplete = [
            OrderDeliveryStatus.complete,
            OrderDeliveryStatus.cancel,
            OrderDeliveryStatus.noDelivery
        ]
        let where = `orderDelivery.status NOT IN (:...statusesNotComplete) 
        AND customer.id = ${customerId}`
        const orderNotComplete = await OrderDelivery.createQueryBuilder('orderDelivery')
            .leftJoinAndSelect('orderDelivery.customer', 'customer')
            .where(where, { statusesNotComplete })
            .orderBy('orderDelivery.id', 'DESC')
            .getCount()

        return orderNotComplete
    }
}
