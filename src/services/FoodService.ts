import { Service } from "@tsed/common";
import { Exception } from "ts-httpexceptions";

import { CoreService } from "../core/services/CoreService";

import { Food } from "../entity/Food";
import { Store } from "../entity/Store";
import { MenuFood } from "../entity/MenuFood";
import { FoodGallery } from "../entity/FoodGallery";

type CreateFoodParams = {
    storeId: number
    menuFoodId: number
    food: Food
    galleries: string[]
}

type UpdateFoodParams = CreateFoodParams & {
    foodId: number
}

type GetFoodParams = {
    search: string
    page: number
    limit: number
    storeId: number
    menuFoodId: number

}

@Service()
export class FoodService extends CoreService {

    async getManyAndCount({ search, page, limit, storeId, menuFoodId }: GetFoodParams): Promise<{ foods: Food[], total: number }> {

        let where = `food.name LIKE '%${search}%'
        AND store.id = ${storeId}
        AND food.isDeleted = false`

        if (menuFoodId) {
            where += `AND menuFood.id = ${menuFoodId}`
        }

        const [foods, total] = await Food.createQueryBuilder('food')
            .leftJoinAndSelect('food.menuFood', 'menuFood')
            .leftJoinAndSelect('food.store', 'store')
            .leftJoinAndSelect('food.foodGalleries', 'foodGalleries')
            .where(where)
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('food.position', 'DESC')
            .getManyAndCount()

        return { foods, total }
    }

    public async create({
        storeId, menuFoodId, food, galleries
    }: CreateFoodParams) {
        if (storeId) {
            const store = await Store.findOneOrThrowId(storeId)
            food.store = store
        }

        if (menuFoodId) {
            const menuFood = await MenuFood.findOneOrThrowId(menuFoodId, null, '')
            food.menuFood = menuFood
        }

        if (galleries && galleries.length) {
            const images = galleries.map(image => {
                const item = new FoodGallery()
                item.thumbnail = image
                return item
            })
            await FoodGallery.save(images)

            food.foodGalleries = images
        }

        await food.save()

        return food
    }


    public async update({ food, foodId, menuFoodId, storeId, galleries }: UpdateFoodParams) {
        await Food.findOneOrThrowId(foodId)
        food.id = foodId

        if (menuFoodId) {
            const menuFood = await MenuFood.findOneOrThrowId(menuFoodId, null, '')
            food.menuFood = menuFood
        }

        if (menuFoodId == 0) {
            food.menuFood = null
        }

        if (galleries && galleries.length) {
            const images = galleries.map(image => {
                const item = new FoodGallery()
                item.thumbnail = image
                return item
            })
            await FoodGallery.save(images)

            food.foodGalleries = images
        }

        await food.save()

        return food
    }
}
