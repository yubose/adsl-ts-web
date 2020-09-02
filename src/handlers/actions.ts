import {
  ActionChainActionCallback,
  NOODLActionChainActionType,
  EvalObjectAction,
  Goto as GotoAction,
  PageJumpAction,
  PopUpAction,
  PopUpDismissAction,
  RefreshAction,
  UpdateObjectAction,
} from 'noodl-ui'
import { AppStore } from 'app/types/storeTypes'
import Page from 'Page'
import { setPage } from 'features/page'

const makeActions = function ({
  store,
  page,
}: {
  store: AppStore
  page: Page
}) {
  // @ts-expect-error
  const _actions: Record<
    NOODLActionChainActionType,
    ActionChainActionCallback<any>
  > = {}

  _actions.evalObject = async (action: EvalObjectAction, options) => {
    //
  }

  _actions.goto = async (action: GotoAction, options) => {
    // URL
    if (_.isString(action)) {
      if (action.startsWith('http')) {
        await page.navigate(action)
      } else {
        store.dispatch(setPage(action))
      }
    } else if (_.isPlainObject(action)) {
      // Currently don't know of any known properties the goto syntax has.
      // We will support a "destination" key since it exists on goto which will
      // soon be deprecated by this goto action
      if (action.destination) {
        if (action.startsWith('http')) {
          await page.navigate(action.destination)
        } else {
          store.dispatch(setPage(action.destination))
        }
      } else {
        const logMsg =
          '[ACTION][goto] ' +
          'Tried to go to a page but could not find information on the whereabouts'
        console.log(logMsg, `color:#ec0000;font-weight:bold;`, {
          action,
          ...options,
        })
      }
    }
  }

  _actions.pageJump = async (action: PageJumpAction, options) => {
    const logMsg = `%c[actions.ts][pageJump]`
    console.log(logMsg, `color:#3498db;font-weight:bold;`, {
      action,
      ...options,
    })
    store.dispatch(setPage(action.destination))
  }

  _actions.popUp = (action: PopUpAction, options) => {
    //
  }

  _actions.popUpDismiss = (action: PopUpDismissAction, options) => {
    //
  }

  _actions.refresh = (action: RefreshAction, options) => {
    //
  }

  _actions.saveObject = (action: SaveObjectAction, options) => {
    //
  }

  _actions.updateObject = (action: UpdateObjectAction, options) => {
    //
  }

  return _actions
}

export default makeActions
