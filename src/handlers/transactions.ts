import Logger from 'logsnap'
import { nuiEmitTransaction } from 'noodl-ui'
import { NDOMTransaction } from 'noodl-ui-dom'
import App from '../App'

const log = Logger.create('transactions.ts')

const createTransactions = function _createTransactions(app: App) {
  const transactions = {} as NDOMTransaction

  transactions[nuiEmitTransaction.REQUEST_PAGE_OBJECT] =
    async function onRequestPageObject(page) {
      return (
        (await app.getPageObject.call(app, page)) || {
          fallback: true,
          components: [],
        }
      )
    }

  return transactions
}

export default createTransactions
