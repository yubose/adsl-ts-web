import _ from 'lodash'
import { AppStore, RootState } from 'app/types'
import { observeStore } from 'utils/common'

const onPageChange = function (store: AppStore) {
  let _pages = _.pick(store.getState().page, ['previousPage', 'currentPage'])

  function select(state: RootState) {
    const { previousPage, currentPage } = state.page
    let logMsg
    let logStyle = `color:#D9760F;font-weight:bold;`

    if (
      previousPage !== _pages.previousPage ||
      currentPage !== _pages.currentPage
    ) {
      const logArgs = { prevState: _.assign({}, _pages) } as any

      _pages = {
        previousPage: state.page.previousPage,
        currentPage: state.page.currentPage,
      }

      logArgs.nextState = _pages
      logMsg = `%c[onPageChange.ts][onPageChange -- observer] Previous/current page changed`

      console.log(logMsg, logStyle, logArgs)
    } else {
      logMsg = `%c[onPageChange.ts][onPageChange -- observer] Previous/current page has not changed`
      logStyle = 'color:grey;font-weight:bold'
    }

    return _pages
  }

  function onPageChange(changes: typeof _pages | undefined) {
    //
  }

  const unsubscribe = observeStore(store, select, onPageChange)

  return unsubscribe
}

export default onPageChange
