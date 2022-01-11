import { PageObject } from 'noodl-types'
import { nuiEmitTransaction, Page as NUIPage } from 'noodl-ui'
import { NDOMTransaction } from 'noodl-ui-dom'
import App from '../App'

const createTransactions = function _createTransactions(app: App) {
  const transactions = {} as NDOMTransaction

  // @ts-expect-error
  transactions[nuiEmitTransaction.REQUEST_PAGE_OBJECT] =
    async function onRequestPageObject(
      page: NUIPage,
    ): Promise<{ aborted: true } | PageObject> {
      return (
        // @ts-expect-error
        (await app.getPageObject.call(app, page)) || {
          components: [],
        }
      )
    }

  return transactions
}

export default createTransactions
