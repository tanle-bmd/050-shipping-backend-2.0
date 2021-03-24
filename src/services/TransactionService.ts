import { Service } from "@tsed/common";
import { Exception } from "ts-httpexceptions";

import { CoreService } from "../core/services/CoreService";

import { Transaction, TYPE_TRANSACTION } from "../entity/Transaction";
import { OrderDelivery } from "../entity/OrderDelivery";
import { OrderFood } from "../entity/OrderFood";
import { OrderTransport } from "../entity/OrderTransport";
import { Driver } from '../entity/Driver';
import { convertIntToDDMMYY, convertIntToddddDDMMYY, capitalize, getDateInterval } from "../util/helper";

@Service()
export class TransactionService extends CoreService {
    public async handleTransactionOrder(order: OrderDelivery | OrderFood | OrderTransport) {
        const { driver, code, moneyDistance, moneyIncome } = order
        const different = moneyDistance - moneyIncome
        driver.balance = driver.balance - different
        await driver.save()
        // Create new transaction
        const transaction = new Transaction()
        transaction.driver = driver
        transaction.change = -different
        transaction.balanceAfterChange = driver.balance
        transaction.code = code
        transaction.type = TYPE_TRANSACTION.income
        await transaction.save()
    }

    async getReport(driver: Driver, start: number, end: number) {
        const transactions = await Transaction.createQueryBuilder('transaction')
            .where(`driver.id = ${driver.id} AND transaction.dateCreated BETWEEN ${start} AND ${end}`)
            .leftJoin("transaction.driver", "driver")
            .getMany()

        const transactionsGroupByDay = {}
        transactions.map(order => {
            const date = convertIntToddddDDMMYY(order.dateCreated)
            const dateDMY = convertIntToDDMMYY(order.dateCreated)
            if (!transactionsGroupByDay[date]) {
                transactionsGroupByDay[date] = {
                    total: 0,
                    point: 0
                }
            }
            const { start, end } = getDateInterval(date)
            transactionsGroupByDay[date].total += 1
            transactionsGroupByDay[date].point += order.change
            transactionsGroupByDay[date].date = dateDMY
        })

        const reports = []
        for (const date in transactionsGroupByDay) {
            reports.push({
                date: capitalize(date),
                dateDMY: transactionsGroupByDay[date].date,
                total: transactionsGroupByDay[date],
            })
            delete transactionsGroupByDay[date].date
        }

        return reports
    }
}
