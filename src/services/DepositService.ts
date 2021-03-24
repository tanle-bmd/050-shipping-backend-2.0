import { Service } from "@tsed/common";

import { CoreService } from "../core/services/CoreService";
import { Transaction, TransactionManager, EntityManager } from "typeorm";
import { Deposit } from "../entity/Deposit";

@Service()
export class DepositService extends CoreService {

    @Transaction()
    async depositTransaction(deposit: Deposit, @TransactionManager() manager: EntityManager): Promise<Deposit> {
        deposit.driver.balance += deposit.amount
        await deposit.save()
        await deposit.driver.save()
        return deposit
    }


}
