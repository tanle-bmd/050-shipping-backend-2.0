import { Service } from "@tsed/common";
import { Exception } from "ts-httpexceptions";

import { CoreService } from "../core/services/CoreService";

import { OrderFood, OrderFoodStatus } from "../entity/OrderFood";
import { getFromToDate } from "../util/helper";

@Service()
export class OrderFoodService extends CoreService {
    public async getManyAndCount({ search, page, limit, from, to, status, storeId, areaId }) {

        let where = `CONCAT( orderFood.code, ' ', customer.name, ' ', ifnull(driver.name, ''), ' ', customer.phone, ' ', ifnull(driver.phone, ''))
        LIKE '%${search}%'`;

        if (from && to) {
            const { start, end } = getFromToDate(from, to)
            where += ` AND orderFood.dateCreated BETWEEN ${start} AND ${end}`
        }

        if (status) {
            where += ` AND orderFood.status LIKE '%${status}%'`
        }

        if (storeId) {
            where += ` AND store.id = ${storeId}`
        }

        if (areaId) {
            where += ` AND area.id = ${areaId}`
        }

        const [orderFoods, total] = await OrderFood.createQueryBuilder('orderFood')
            .leftJoinAndSelect('orderFood.area', 'area')
            .skip((page - 1) * limit)
            .take(limit)
            .where(where)
            .leftJoinAndSelect('orderFood.customer', 'customer')
            .leftJoinAndSelect('orderFood.driver', 'driver')
            .leftJoinAndSelect('orderFood.details', 'details')
            .leftJoinAndSelect('details.food', 'food')
            .leftJoinAndSelect('orderFood.store', 'store')
            .orderBy('orderFood.id', 'DESC')
            .getManyAndCount()

        const orderFoodDate = await OrderFood.createQueryBuilder('orderFood')
            .leftJoinAndSelect('orderFood.area', 'area')
            .where(where)
            .leftJoinAndSelect('orderFood.customer', 'customer')
            .leftJoinAndSelect('orderFood.driver', 'driver')
            .leftJoinAndSelect('orderFood.details', 'details')
            .leftJoinAndSelect('details.food', 'food')
            .leftJoinAndSelect('orderFood.store', 'store')
            .orderBy('orderFood.id', 'DESC')
            .getMany()

        const totalIncome = orderFoodDate.reduce((acc, order) => acc + order.moneyIncome, 0)
        const totalRevenue = orderFoodDate.reduce((acc, order) => acc + (order.moneyDistance - order.moneyIncome), 0)
        const totalMoneyTotal = orderFoodDate.reduce((acc, order) => acc + order.moneyTotal, 0)

        return { orderFoods, total, totalIncome, totalRevenue, totalMoneyTotal }
    }


    public async getTotalNotComplete(customerId: number) {
        const statusesNotComplete = [OrderFoodStatus.complete, OrderFoodStatus.cancel, OrderFoodStatus.noDelivery]
        let where = `orderFood.status NOT IN (:...statusesNotComplete) 
        AND customer.id = ${customerId}`
        const orderNotComplete = await OrderFood.createQueryBuilder('orderFood')
            .leftJoinAndSelect('orderFood.customer', 'customer')
            .where(where, { statusesNotComplete })
            .orderBy('orderFood.id', 'DESC')
            .getCount()

        return orderNotComplete
    }
}
