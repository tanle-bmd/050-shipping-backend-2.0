import { Service } from "@tsed/common";
import { Exception } from "ts-httpexceptions";

import { CoreService } from "../core/services/CoreService";

import { Driver } from "../entity/Driver";
import { validatePassword } from "../util/passwordHelper";

@Service()
export class DriverService extends CoreService {
    /**
     * =====================IS VALID PASSWORD=====================
     */
    public async isValidPassword(id: number, password: string): Promise<Driver> {
        //Because select password is false for config
        const driver = await Driver.findOneOrThrowOption({
            select: ["password", "id"],
            where: { id }
        })

        // Check valid password
        let validate = await validatePassword(password, driver.password)
        return validate ? driver : null
    }
}
