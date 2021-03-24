// IMPORT LIBRARY
import { Service } from "@tsed/common";

// IMPORT CUSTOM
import { CoreService } from "../core/services/CoreService";
import { OrderFood, OrderFoodStatus } from "../entity/OrderFood";
import { OrderDelivery, OrderDeliveryStatus } from "../entity/OrderDelivery";
import { OrderTransport, OrderTransportStatus } from "../entity/OrderTransport";
import { Driver } from "../entity/Driver";

@Service()
export class OrderService extends CoreService {

    public async isDelivering(driver: Driver) {
        const [
            orderFood,
            orderDelivery,
            orderTransport
        ] = await Promise.all([
            OrderFood.find({
                where: { status: OrderFoodStatus.delivering, driver }
            }),
            OrderDelivery.find({
                where: { status: OrderDeliveryStatus.delivering, driver }
            }),
            OrderTransport.find({
                where: { status: OrderDeliveryStatus.delivering, driver }
            })
        ])

        const total = orderFood.length + orderDelivery.length + orderTransport.length
        console.log('total:', total)

        return total >= 2
    }
}