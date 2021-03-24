// IMPORT LIBRARY
import { Service } from "@tsed/common";
import { BadRequest } from "ts-httpexceptions";


// IMPORT CUSTOM
import { ConfigOrder, ConfigOrderType } from "../entity/ConfigOrder";


interface CreateItemParams {
    type: ConfigOrderType
    minPrice: number
    kmMinPrice: number
    pricePerKM: number
    areaId: number
}

@Service()
export class ConfigOrderService {

    public async init(areaId: number) {
        const oldConfigs = await this.getConfigsByArea(areaId)

        if (oldConfigs && oldConfigs.length) {
            throw new BadRequest(`Đã tồn tại cấu hình giá cho khu vực này.`)
        }

        await this.createItem({ areaId, type: ConfigOrderType.Food, minPrice: 10000, pricePerKM: 4000, kmMinPrice: 2 })
        await this.createItem({ areaId, type: ConfigOrderType.Delivery, minPrice: 10000, pricePerKM: 4000, kmMinPrice: 2 })
        await this.createItem({ areaId, type: ConfigOrderType.Transport, minPrice: 10000, pricePerKM: 4000, kmMinPrice: 2 })
    }

    private async createItem({ type, minPrice, kmMinPrice, pricePerKM, areaId }: CreateItemParams) {
        const config = new ConfigOrder()
        config.type = type
        config.minPrice = minPrice
        config.kmMinPrice = kmMinPrice
        config.pricePerKM = pricePerKM
        await config.assignArea(areaId)
        await config.save()
    }


    public async getConfigsByArea(areaId: number) {
        let where = `area.id = ${areaId}`
        const configs = await ConfigOrder.createQueryBuilder('configOrder')
            .leftJoin('configOrder.area', 'area')
            .where(where)
            .orderBy('configOrder.id', 'DESC')
            .getMany()

        return configs
    }


    public async getConfig(areaId: number, type: ConfigOrderType) {
        let where = `area.id = ${areaId} AND configOrder.type = '${type}'`
        const config = await ConfigOrder.createQueryBuilder('configOrder')
            .leftJoin('configOrder.area', 'area')
            .where(where)
            .getOne()

        return config
    }

} //END FILE
