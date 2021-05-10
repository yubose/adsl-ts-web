import Logger from 'logsnap'
import {
  Page as NOODLDOMPage,
  transaction as ndomTransaction,
} from 'noodl-ui-dom'
import App from '../App'

const log = Logger.create('transactions.ts')

/**
 * Used to customize the creation of certain elements that we need for
 * the full lifecycle
 */
const createTransactions = function _createTransactions(app: App) {
  const transactions = {
    async [ndomTransaction.REQUEST_PAGE_OBJECT](page: NOODLDOMPage) {
      const pageObject = await app.getPageObject(page)
      window.pageObject = pageObject
      return pageObject || { fallback: true, components: [] }
    },
  } as const

  return transactions
}

export default createTransactions
