// IMPORT LIBRARY
import { Service } from "@tsed/common";
import { BadRequest } from "ts-httpexceptions";


// IMPORT CUSTOM
import { ConfigCommission, ConfigCommissionType } from "../entity/ConfigCommission";


interface CreateItemParams {
    type: ConfigCommissionType
    value: number
    areaId: number
}


@Service()
export class ConfigCommissionService {

    public async init(areaId: number) {
        const oldConfigs = await this.getConfigsByArea(areaId)

        if (oldConfigs && oldConfigs.length) {
            throw new BadRequest(`Đã tồn tại cấu hình hoa hồng cho khu vực này.`)
        }

        await this.createItem({ areaId, type: ConfigCommissionType.Food, value: 10 })
        await this.createItem({ areaId, type: ConfigCommissionType.Delivery, value: 10 })
        await this.createItem({ areaId, type: ConfigCommissionType.Transport, value: 10 })
    }

    private async createItem({ type, value, areaId }: CreateItemParams) {
        const config = new ConfigCommission()
        config.type = type
        config.value = value
        await config.assignArea(areaId)
        await config.save()
    }


    public async getConfigsByArea(areaId: number) {
        let where = `area.id = ${areaId}`
        const configs = await ConfigCommission.createQueryBuilder('configCommission')
            .leftJoinAndSelect('configCommission.area', 'area')
            .where(where)
            .orderBy('configCommission.id', 'DESC')
            .getMany()

        return configs
    }


    public async getConfig(areaId: number, type: ConfigCommissionType) {
        let where = `area.id = ${areaId} AND configCommission.type = '${type}'`
        const config = await ConfigCommission.createQueryBuilder('configCommission')
            .leftJoin('configCommission.area', 'area')
            .where(where)
            .getOne()

        return config
    }

} //END FILE
