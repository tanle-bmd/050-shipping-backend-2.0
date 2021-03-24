// IMPORT LIBRARY
import { Service } from "@tsed/common";


// IMPORT CUSTOM
import { MenuFood } from "../entity/MenuFood";
import { Store } from "../entity/Store";

@Service()
export class MenuFoodService {

    async getManyAndCount({ search, page, limit, storeId }): Promise<{ menuFoods: MenuFood[], total: number }> {
        let where = `menuFood.name LIKE "%${search}%" 
        AND menuFood.isDeleted = false 
        AND store.id = ${storeId}`

        const [menuFoods, total] = await MenuFood.createQueryBuilder('menuFood')
            .leftJoinAndSelect('menuFood.store', 'store')
            .where(where)
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('menuFood.id', 'DESC')
            .getManyAndCount()

        return { menuFoods, total }
    }


    public async create(storeId: number, menuFood: MenuFood) {
        const store = await Store.findOneOrThrowId(storeId, null, '')
        menuFood.store = store
        await menuFood.save()
        return menuFood
    }

} //END FILE
