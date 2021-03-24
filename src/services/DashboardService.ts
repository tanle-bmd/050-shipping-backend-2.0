import { Service } from "@tsed/common";

import { CoreService } from "../core/services/CoreService";
import { Driver } from '../entity/Driver';
import { getTodayInterval, getThisMonthInterval, convertFullDateToInt, convertIntToDDMMYY, getFromToDate } from "../util/helper";
import { Customer } from '../entity/Customer';
import { OrderFood, OrderFoodStatus } from "../entity/OrderFood";
import { Config, PARAMS } from "../entity/Config";
import { OrderDelivery, OrderDeliveryStatus } from "../entity/OrderDelivery";
import { OrderTransport, OrderTransportStatus } from '../entity/OrderTransport';
import { Deposit } from "../entity/Deposit";
import { Withdraw } from "../entity/Withdraw";

@Service()
export class DashboardService extends CoreService {

    async getCommissionAndIncome(typeOrder: PARAMS, start: number, end: number, areaId: number): Promise<{
        commission: number,
        income: number
    }> {
        const commissionPercent = await Config.findOneOrThrowOption({
            where: { param: `${typeOrder}` }
        })

        let totalMoney = null
        let totalIncome = null

        let where = `order.status = '${OrderFoodStatus.complete}'`

        if (start && end) {
            where += ` AND order.dateCreated BETWEEN ${start} AND ${end} `
        }

        if (areaId) {
            where += ` AND area.id = ${areaId}`
        }

        switch (typeOrder) {
            case PARAMS.commissionFood:
                [totalMoney, totalIncome] = await Promise.all([
                    OrderFood.createQueryBuilder('order')
                        .leftJoinAndSelect('order.area', 'area')
                        .select("SUM(order.moneyDistance)", 'sum')
                        .where(where, { status: OrderFoodStatus.complete })
                        .getRawOne(),
                    OrderFood.createQueryBuilder('order')
                        .leftJoinAndSelect('order.area', 'area')
                        .select("SUM(order.moneyIncome)", 'sum')
                        .where(where, { status: OrderFoodStatus.complete })
                        .getRawOne()
                ]);
                break;
            case PARAMS.commissionDelivery:
                [totalMoney, totalIncome] = await Promise.all([
                    OrderDelivery.createQueryBuilder('order')
                        .select("SUM(order.moneyDistance)", 'sum')
                        .leftJoinAndSelect('order.area', 'area')
                        .where(where, { status: OrderDeliveryStatus.complete })
                        .getRawOne(),
                    OrderDelivery.createQueryBuilder('order')
                        .select("SUM(order.moneyIncome)", 'sum')
                        .leftJoinAndSelect('order.area', 'area')
                        .where(where, { status: OrderDeliveryStatus.complete })
                        .getRawOne()
                ])
                break;
            case PARAMS.commissionTransport:
                [totalMoney, totalIncome] = await Promise.all([
                    OrderTransport.createQueryBuilder('order')
                        .select("SUM(order.moneyDistance)", 'sum')
                        .leftJoinAndSelect('order.area', 'area')
                        .where(where, { status: OrderTransportStatus.complete })
                        .getRawOne(),
                    OrderTransport.createQueryBuilder('order')
                        .select("SUM(order.moneyIncome)", 'sum')
                        .leftJoinAndSelect('order.area', 'area')
                        .where(where, { status: OrderTransportStatus.complete })
                        .getRawOne()
                ])
                break;
            default:
                totalIncome = 0
                totalMoney = 0
                break;
        }
        return {
            commission: +commissionPercent.value / 100 * totalMoney.sum,
            income: totalIncome.sum
        }
    }

    async getSummaryOrderFood(start: number, end: number, areaId: number) {
        let whereTotal = ` orderFood.status = '${OrderFoodStatus.complete}'`

        if (start && end) {
            whereTotal += ` AND orderFood.dateCreated  BETWEEN ${start} AND ${end}`
        }

        const { start: startNow } = getTodayInterval()
        let whereToday = ` orderFood.status = '${OrderFoodStatus.complete}' 
        AND orderFood.dateCreated > ${startNow}`

        if (areaId) {
            whereTotal += ` AND area.id = ${areaId}`
            whereToday += ` AND area.id = ${areaId}`
        }

        const [
            totalOrderFood,
            totalOrderFoodToday,
            { commission: orderFoodCommission, income: orderFoodIncome }
        ] = await Promise.all([
            OrderFood.createQueryBuilder('orderFood')
                .where(whereTotal)
                .leftJoinAndSelect('orderFood.area', 'area')
                .getCount(),
            OrderFood.createQueryBuilder('orderFood')
                .leftJoinAndSelect('orderFood.area', 'area')
                .where(whereToday)
                .getCount(),
            this.getCommissionAndIncome(PARAMS.commissionFood, start, end, areaId)
        ])

        return {
            totalOrderFood,
            totalOrderFoodToday,
            orderFoodCommission,
            orderFoodIncome
        }
    }

    async getSummaryOrderDelivery(start: number, end: number, areaId: number) {
        let whereTotal = ` orderDelivery.status = '${OrderDeliveryStatus.complete}'`

        if (start && end) {
            whereTotal += ` AND orderDelivery.dateCreated  BETWEEN ${start} AND ${end}`
        }

        const { start: startNow } = getTodayInterval()
        let whereToday = ` orderDelivery.status = '${OrderDeliveryStatus.complete}' 
        AND orderDelivery.dateCreated > ${startNow}`

        if (areaId) {
            whereTotal += ` AND area.id = ${areaId}`
            whereToday += ` AND area.id = ${areaId}`
        }

        const [
            totalOrderDelivery,
            totalOrderDeliveryToday,
            { commission: orderDeliveryCommission, income: orderDeliveryIncome }
        ] = await Promise.all([
            OrderDelivery.createQueryBuilder('orderDelivery')
                .where(whereTotal)
                .leftJoinAndSelect('orderDelivery.area', 'area')
                .getCount(),
            OrderDelivery.createQueryBuilder('orderDelivery')
                .leftJoinAndSelect('orderDelivery.area', 'area')
                .where(whereToday)
                .getCount(),
            this.getCommissionAndIncome(PARAMS.commissionDelivery, start, end, areaId)
        ])

        return {
            totalOrderDelivery,
            totalOrderDeliveryToday,
            orderDeliveryCommission,
            orderDeliveryIncome
        }
    }

    async getSummaryOrderTransport(start: number, end: number, areaId: number) {
        let whereTotal = ` orderTransport.status = '${OrderTransportStatus.complete}'`

        if (start && end) {
            whereTotal += ` AND orderTransport.dateCreated  BETWEEN ${start} AND ${end}`
        }

        const { start: startNow } = getTodayInterval()
        let whereToday = ` orderTransport.status = '${OrderTransportStatus.complete}' 
        AND orderTransport.dateCreated > ${startNow}`

        if (areaId) {
            whereTotal += ` AND area.id = ${areaId}`
            whereToday += ` AND area.id = ${areaId}`
        }

        const [
            totalOrderTransport,
            totalOrderTransportToday,
            { commission: orderTransportCommission, income: orderTransportIncome }
        ] = await Promise.all([
            OrderTransport.createQueryBuilder('orderTransport')
                .where(whereTotal)
                .leftJoinAndSelect('orderTransport.area', 'area')
                .getCount(),
            OrderTransport.createQueryBuilder('orderTransport')
                .leftJoinAndSelect('orderTransport.area', 'area')
                .where(whereToday)
                .getCount(),
            this.getCommissionAndIncome(PARAMS.commissionTransport, start, end, areaId)
        ])

        return {
            totalOrderTransport,
            totalOrderTransportToday,
            orderTransportCommission,
            orderTransportIncome
        }
    }

    async getTotalDeposit(): Promise<number> {
        const { sum } = await Deposit
            .createQueryBuilder('deposit')
            .select("sum(deposit.amount)", 'sum')
            .getRawOne()
        return sum
    }

    async getTotalWithdraw() {
        const { sum } = await Withdraw
            .createQueryBuilder('withdraw')
            .select("sum(withdraw.amount)", 'sum')
            .getRawOne()
        return sum
    }

    async getSummary(start: number, end: number, areaId: number) {
        const { start: startNow } = getTodayInterval()

        let whereDriverTotal = `driver.isBlock = false AND driver.isDeleted = false`
        let whereDriverToday = `driver.isBlock = false AND driver.isDeleted = false AND driver.dateCreated > ${startNow}`
        let whereCustomerTotal = `customer.isBlock = false`
        let whereCustomerToday = `customer.isBlock = false AND customer.dateCreated > ${startNow}`

        if (areaId) {
            whereDriverTotal += ` AND area.id = ${areaId}`
            whereDriverToday += ` AND area.id = ${areaId}`
            whereCustomerTotal += ` AND area.id = ${areaId}`
            whereCustomerToday += ` AND area.id = ${areaId}`
        }

        const [
            totalDriver,
            totalDriverToday,
            totalCustomer,
            totalCustomerToday,
            {
                totalOrderFood,
                totalOrderFoodToday,
                orderFoodCommission,
                orderFoodIncome
            },
            {
                totalOrderDelivery,
                totalOrderDeliveryToday,
                orderDeliveryCommission,
                orderDeliveryIncome
            },
            {
                totalOrderTransport,
                totalOrderTransportToday,
                orderTransportCommission,
                orderTransportIncome
            },
            totalDeposit,
            totalWithdraw
        ] = await Promise.all([
            Driver.createQueryBuilder('driver')
                .leftJoinAndSelect('driver.area', 'area')
                .where(whereDriverTotal)
                .getCount(),
            Driver.createQueryBuilder('driver')
                .leftJoinAndSelect('driver.area', 'area')
                .where(whereDriverToday)
                .getCount(),
            Customer.createQueryBuilder('customer')
                .leftJoinAndSelect('customer.area', 'area')
                .where(whereCustomerTotal)
                .getCount(),
            Customer.createQueryBuilder('customer')
                .leftJoinAndSelect('customer.area', 'area')
                .where(whereCustomerToday)
                .getCount(),
            this.getSummaryOrderFood(start, end, areaId),
            this.getSummaryOrderDelivery(start, end, areaId),
            this.getSummaryOrderTransport(start, end, areaId),
            this.getTotalDeposit(),
            this.getTotalWithdraw()
        ])

        return {
            totalDriver,
            totalDriverToday,
            totalCustomer,
            totalCustomerToday,
            totalOrderFood,
            totalOrderFoodToday,
            orderFoodCommission,
            orderFoodIncome,
            totalOrderDelivery,
            totalOrderDeliveryToday,
            orderDeliveryCommission,
            orderDeliveryIncome,
            totalOrderTransport,
            totalOrderTransportToday,
            orderTransportCommission,
            orderTransportIncome,
            totalDeposit,
            totalWithdraw
        }
    }


    async getCustomerLast30(from: Date = null, to: Date = null, areaId: number) {
        const { start, end } = getFromToDate(from, to)

        let where = `customer.isBlock = false AND customer.dateCreated BETWEEN ${start} AND ${end} `
        if (areaId) {
            where += ` AND area.id = ${areaId}`
        }
        const customers = await Customer.createQueryBuilder('customer')
            .leftJoinAndSelect('customer.area', 'area')
            .where(where)
            .orderBy('customer.dateCreated', 'ASC')
            .getMany()

        const ordersGroupByDay = {}
        customers.map(customer => {
            const date = convertIntToDDMMYY(customer.dateCreated)
            if (!ordersGroupByDay[date]) {
                ordersGroupByDay[date] = 0
            }
            ordersGroupByDay[date] += 1
        })

        const reports = []
        for (const date in ordersGroupByDay) {
            reports.push({
                date,
                total: ordersGroupByDay[date],
            })
        }

        return reports
    }

    async getOrderFoodLast30(from: Date = null, to: Date = null, areaId: number) {
        const { start, end } = getFromToDate(from, to)

        let where = `orderFood.dateCreated  BETWEEN ${start} AND ${end} 
        AND orderFood.status = '${OrderFoodStatus.complete}'`
        if (areaId) {
            where += ` AND area.id = ${areaId}`
        }
        const orders = await OrderFood.createQueryBuilder('orderFood')
            .leftJoinAndSelect('orderFood.area', 'area')
            .where(where)
            .orderBy('orderFood.dateCreated', 'ASC')
            .getMany()

        const ordersGroupByDay = {}
        orders.map(order => {
            const date = convertIntToDDMMYY(order.dateCreated)
            if (!ordersGroupByDay[date]) {
                ordersGroupByDay[date] = 0
            }
            ordersGroupByDay[date] += 1
        })

        const reports = []
        for (const date in ordersGroupByDay) {
            reports.push({
                date,
                total: ordersGroupByDay[date],
            })
        }

        return reports
    }

    async getOrderDeliveryLast30(from: Date = null, to: Date = null, areaId: number) {
        const { start, end } = getFromToDate(from, to)
        let where = `orderDelivery.dateCreated  BETWEEN ${start} AND ${end} 
        AND orderDelivery.status = '${OrderDeliveryStatus.complete}'`
        if (areaId) {
            where += ` AND area.id = ${areaId}`
        }
        const orders = await OrderDelivery.createQueryBuilder('orderDelivery')
            .leftJoinAndSelect('orderDelivery.area', 'area')
            .where(where)
            .orderBy('orderDelivery.dateCreated', 'ASC')
            .getMany()

        const ordersGroupByDay = {}
        orders.map(order => {
            const date = convertIntToDDMMYY(order.dateCreated)
            if (!ordersGroupByDay[date]) {
                ordersGroupByDay[date] = 0
            }
            ordersGroupByDay[date] += 1
        })

        const reports = []
        for (const date in ordersGroupByDay) {
            reports.push({
                date,
                total: ordersGroupByDay[date],
            })
        }

        return reports
    }

    async getOrderTransportLast30(from: Date = null, to: Date = null, areaId: number) {
        const { start, end } = getFromToDate(from, to)
        let where = `orderTransport.dateCreated  BETWEEN ${start} AND ${end} 
        AND orderTransport.status = '${OrderTransportStatus.complete}'`
        if (areaId) {
            where += ` AND area.id = ${areaId}`
        }
        const orders = await OrderTransport.createQueryBuilder('orderTransport')
            .leftJoinAndSelect('orderTransport.area', 'area')
            .where(where)
            .orderBy('orderTransport.dateCreated', 'ASC')
            .getMany()

        const ordersGroupByDay = {}
        orders.map(order => {
            const date = convertIntToDDMMYY(order.dateCreated)
            if (!ordersGroupByDay[date]) {
                ordersGroupByDay[date] = 0
            }
            ordersGroupByDay[date] += 1
        })

        const reports = []
        for (const date in ordersGroupByDay) {
            reports.push({
                date,
                total: ordersGroupByDay[date],
            })
        }

        return reports
    }

    public async getTop5Drivers(areaId: number) {
        const { start, end } = getThisMonthInterval()
        let where = `driver.isBlock = :isBlock AND order.dateCreated >= :start`
        if (areaId) {
            where += ` AND area.id = ${areaId}`
        }
        const [
            orderFood,
            orderDelivery,
            orderTransport
        ] = await Promise.all([
            OrderFood.createQueryBuilder('order')
                .innerJoin("order.driver", "driver")
                .leftJoin('order.area', 'area')
                .select("driver.id, driver.name, driver.phone, driver.licensePlate, driver.balance")
                .addSelect("COUNT(*)", "orders")
                .where(where, { isBlock: false, start })
                .groupBy("order.driver")
                .orderBy("orders", "DESC")
                .limit(5)
                .getRawMany(),
            OrderDelivery.createQueryBuilder('order')
                .innerJoin("order.driver", "driver")
                .leftJoin('order.area', 'area')
                .select("driver.id, driver.name, driver.phone, driver.licensePlate, driver.balance")
                .addSelect("COUNT(*)", "orders")
                .where(where, { isBlock: false, start })
                .groupBy("order.driver")
                .orderBy("orders", "DESC")
                .limit(5)
                .getRawMany(),
            OrderTransport.createQueryBuilder('order')
                .innerJoin("order.driver", "driver")
                .leftJoin('order.area', 'area')
                .select("driver.id, driver.name, driver.phone, driver.licensePlate, driver.balance")
                .addSelect("COUNT(*)", "orders")
                .where(where, { isBlock: false, start })
                .groupBy("order.driver")
                .orderBy("orders", "DESC")
                .limit(5)
                .getRawMany()
        ])

        return {
            orderFood,
            orderDelivery,
            orderTransport
        }
    }

    public async getTop5Customers(areaId: number) {
        const { start, end } = getThisMonthInterval()
        let where = `customer.isBlock = :isBlock AND order.dateCreated >= :start`
        if (areaId) {
            where += ` AND area.id = ${areaId}`
        }
        const [
            orderFood,
            orderDelivery,
            orderTransport
        ] = await Promise.all([
            OrderFood.createQueryBuilder('order')
                .innerJoin("order.customer", "customer")
                .leftJoin('order.area', 'area')
                .select("customer.id, customer.name, customer.phone")
                .addSelect("COUNT(*)", "orders")
                .where(where, { isBlock: false, start })
                .groupBy("order.customer")
                .orderBy("orders", "DESC")
                .limit(5)
                .getRawMany(),

            OrderDelivery.createQueryBuilder('order')
                .innerJoin("order.customer", "customer")
                .leftJoin('order.area', 'area')
                .select("customer.id, customer.name, customer.phone")
                .addSelect("COUNT(*)", "orders")
                .where(where, { isBlock: false, start })
                .groupBy("order.customer")
                .orderBy("orders", "DESC")
                .limit(5)
                .getRawMany(),

            OrderTransport.createQueryBuilder('order')
                .innerJoin("order.customer", "customer")
                .leftJoin('order.area', 'area')
                .select("customer.id, customer.name, customer.phone")
                .addSelect("COUNT(*)", "orders")
                .where(where, { isBlock: false, start })
                .groupBy("order.customer")
                .orderBy("orders", "DESC")
                .limit(5)
                .getRawMany()
        ])

        return {
            orderFood,
            orderDelivery,
            orderTransport
        }
    }
}
