import {
  ActionChainActionCallback,
  NOODLChainActionEvalObject,
  NOODLChainActionGotoObject,
  NOODLChainActionGotoURL,
  NOODLChainActionPageJumpObject,
  NOODLChainActionPopupBaseObject,
  NOODLChainActionPopupDismissObject,
  NOODLChainActionRefreshObject,
  NOODLChainActionSaveObjectObject,
  NOODLChainActionUpdateObject,
  NOODLActionChainActionType,
} from 'noodl-ui'
import { AppStore } from 'app/types/storeTypes'
import Page from 'Page'

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

  _actions.evalObject = async (action, options) => {
    //
  }

  _actions.goto = async (action: NOODLGotoAction, options) => {
    // URL
    if (_.isString(action)) {
      await page.navigate(action)
    } else if (_.isPlainObject(action)) {
      // Currently don't know of any known properties the goto syntax has.
      // We will support a "destination" key since it exists on goto which will
      // soon be deprecated by this goto action
      if (action.destination) {
        await page.navigate(action.destination)
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

  _actions.pageJump = async (action, options) => {
    console.log(action)

    await page.navigate(action.destination)
  }

  _actions.popUp = (action, options) => {
    //
  }

  _actions.popUpDismiss = (action, options) => {
    //
  }

  _actions.refresh = (action, options) => {
    //
  }

  _actions.saveObject = (action, options) => {
    //
  }

  _actions.updateObject = (action, options) => {
    //
  }

  return _actions
}

export default makeActions
