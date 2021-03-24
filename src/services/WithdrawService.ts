import { Service } from "@tsed/common";

import { CoreService } from "../core/services/CoreService";
import { Withdraw } from "../entity/Withdraw";
import { Transaction } from "typeorm";
import { getCurrentTimeInt } from "../util/helper";


@Service()
export class WithdrawService extends CoreService {

    @Transaction()
    async withDrawTransaction(withdraw: Withdraw,): Promise<Withdraw> {
        withdraw.dateCreated = getCurrentTimeInt()
        withdraw.dateUpdated = getCurrentTimeInt()
        withdraw.driver.dateUpdated = getCurrentTimeInt()
        return withdraw
    }

}
