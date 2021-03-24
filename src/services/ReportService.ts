import { Service } from "@tsed/common";
import { CoreService } from "../core/services/CoreService";
import { OrderFood, OrderFoodStatus } from "../entity/OrderFood";
import { OrderDelivery, OrderDeliveryStatus } from "../entity/OrderDelivery";
import { OrderTransport, OrderTransportStatus } from "../entity/OrderTransport";
import { Driver } from '../entity/Driver';

@Service()
export class ReportService {
    async getReportOrderFood(start: number, end: number, driver: Driver) {
        let where = `orderFood.status = '${OrderFoodStatus.complete}'
        AND orderFood.dateCreated  BETWEEN ${start} AND ${end} `
        const orders = await OrderFood.createQueryBuilder('orderFood')
            .leftJoinAndSelect('orderFood.details', 'details')
            .leftJoinAndSelect('details.food', 'food')
            .leftJoinAndSelect('food.store', 'store')
            .where(where)
            .orderBy('orderFood.id', 'DESC')
            .getMany()

        return orders
    }


    async getReportOrderDelivery(start: number, end: number, driver: Driver) {
        let where = `orderDelivery.status = '${OrderDeliveryStatus.complete}'
        AND orderDelivery.dateCreated  BETWEEN ${start} AND ${end} `
        const orders = await OrderDelivery.createQueryBuilder('orderDelivery')
            .leftJoinAndSelect('orderDelivery.details', 'details')
            .where(where)
            .orderBy('orderDelivery.id', 'ASC')
            .getMany()

        return orders
    }


    async getReportOrderTransport(start: number, end: number, driver: Driver) {
        let where = `orderTransport.status = '${OrderTransportStatus.complete}'
        AND orderTransport.dateCreated  BETWEEN ${start} AND ${end} `
        const orders = await OrderTransport.createQueryBuilder('orderTransport')
            .where(where)
            .orderBy('orderTransport.id', 'ASC')
            .getMany()

        return orders
    }


    public async getReport(start: number, end: number) {
        const [orderFood, orderDelivery, orderTransport] = await Promise.all([
            this.getReportOrderFood(start, end, null),
            this.getReportOrderDelivery(start, end, null),
            this.getReportOrderTransport(start, end, null)
        ])
        return {
            orderFood,
            orderDelivery,
            orderTransport
        }
    }


    async getReportOrderFoodDriver(start: number, end: number, driver: Driver) {
        let where = `orderFood.status = '${OrderFoodStatus.complete}'
        AND orderFood.dateCreated BETWEEN ${start} AND ${end} 
        AND driver.id = ${driver.id}`
        const orders = await OrderFood.createQueryBuilder('orderFood')
            .leftJoinAndSelect('orderFood.details', 'details')
            .leftJoinAndSelect('details.food', 'food')
            .leftJoinAndSelect('food.store', 'store')
            .leftJoinAndSelect('orderFood.driver', 'driver')
            .where(where)
            .orderBy('orderFood.id', 'DESC')
            .getMany()

        return orders
    }


    async getReportOrderDeliveryDriver(start: number, end: number, driver: Driver) {
        let where = `orderDelivery.status = '${OrderDeliveryStatus.complete}'
        AND orderDelivery.dateCreated BETWEEN ${start} AND ${end} 
        AND driver.id = ${driver.id}`
        const orders = await OrderDelivery.createQueryBuilder('orderDelivery')
            .leftJoinAndSelect('orderDelivery.details', 'details')
            .leftJoinAndSelect('orderDelivery.driver', 'driver')
            .where(where)
            .orderBy('orderDelivery.id', 'ASC')
            .getMany()

        return orders
    }


    async getReportOrderTransportDriver(start: number, end: number, driver: Driver) {
        let where = `orderTransport.status = '${OrderTransportStatus.complete}'
        AND orderTransport.dateCreated  BETWEEN ${start} AND ${end} 
        AND driver.id = ${driver.id}`
        const orders = await OrderTransport.createQueryBuilder('orderTransport')
            .leftJoinAndSelect('orderTransport.driver', 'driver')
            .where(where)
            .orderBy('orderTransport.id', 'ASC')
            .getMany()

        return orders
    }


    public async getReportByDriver(driver: Driver, start: number, end: number) {
        const [orderFood, orderDelivery, orderTransport] = await Promise.all([
            this.getReportOrderFoodDriver(start, end, driver),
            this.getReportOrderDeliveryDriver(start, end, driver),
            this.getReportOrderTransportDriver(start, end, driver)
        ])
        return {
            orderFood,
            orderDelivery,
            orderTransport
        }
    }
}
