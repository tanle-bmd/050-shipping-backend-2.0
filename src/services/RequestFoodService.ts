// IMPORT LIBRARY
import { Service } from "@tsed/common";


// IMPORT CUSTOM
import { RequestFood, RequestFoodType, RequestFoodStatus } from "../entity/RequestFood";
import { Food } from "../entity/Food";

@Service()
export class RequestFoodService {

    private async handleRequestCreate(request: RequestFood) {
        const {
            name,
            ingredient,
            thumbnail,
            originPrice,
            finalPrice,
            isShow,
            isBlock
        } = request
        const food = new Food()
        if (name) food.name = name
        if (ingredient) food.ingredient = ingredient
        if (thumbnail) food.thumbnail = thumbnail
        if (originPrice) food.originPrice = originPrice
        if (finalPrice) food.finalPrice = finalPrice
        food.isShow = isShow
        food.isBlock = isBlock
        food.store = request.store
        await food.save()
    }

    private async handleRequestUpdate(request: RequestFood) {
        const {
            food,
            name,
            ingredient,
            thumbnail,
            originPrice,
            finalPrice,
            isShow,
            isBlock
        } = request

        if (name) food.name = name
        if (ingredient) food.ingredient = ingredient
        if (thumbnail) food.thumbnail = thumbnail
        if (originPrice) food.originPrice = originPrice
        if (finalPrice) food.finalPrice = finalPrice
        food.isShow = isShow
        food.isBlock = isBlock
        await food.save()
    }


    public async approve(request: RequestFood) {
        if (request.type == RequestFoodType.Create) {
            await this.handleRequestCreate(request)
        } else {
            await this.handleRequestUpdate(request)
        }
        request.status = RequestFoodStatus.Complete
        await request.save()
    }

} //END FILE
