import { Property } from "@tsed/common";
import { OrderFoodDetail } from '../entity/OrderFoodDetail';
import { Food } from '../entity/Food';
import { getCurrentTimeInt } from "../util/helper";

export class OrderFoodDetailInsert {
    @Property()
    foodId: number

    @Property()
    amount: number

    async toOrderFoodDetail(): Promise<OrderFoodDetail> {
        let detail = new OrderFoodDetail()
        const food = await Food.findOneOrThrowId(this.foodId)
        detail.originPrice = food.originPrice
        detail.finalPrice = food.finalPrice
        detail.amount = this.amount
        detail.food = food
        detail.dateCreated = getCurrentTimeInt()
        detail.dateUpdated = getCurrentTimeInt()
        delete detail.id
        return detail
    }
}
