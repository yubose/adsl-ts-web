/**
 * PLAN TO BE USED AS THE ONE MAIN GOTO FUNCTION
 */
import * as u from '@jsmanifest/utils'
import curry from 'lodash/curry'
import type {
  ConsumerOptions,
  NUIAction,
  EmitAction,
  Store,
  NUITrigger,
} from 'noodl-ui'
import type { Page as NDOMPage } from 'noodl-ui-dom'
import App from '../../App'

function getNDOMPage(app: App, opts: ConsumerOptions) {
  return (app.pickNDOMPage(opts?.page) || app.mainPage) as NDOMPage
}

export function useGotoSpinner(
  app: App,
  fn: (action: NUIAction, options: ConsumerOptions) => Promise<void>,
) {
  return function onGotoWithSpinner(
    action: NUIAction,
    options: ConsumerOptions,
  ) {
    const state = app.getState()

    if (!state.spinner.active) {
      app.enableSpinner({
        page: options?.page?.page,
        trigger: action.trigger as NUITrigger,
      })
    }

    if (app.currentPage in app.noodl.root[app.currentPage]) {
      app.noodl.emit({
        type: 'DELETE_PAGE',
        payload: { pageName: app.currentPage },
      })
    }

    return fn(action, options)
  }
}

function createGoto(app: App) {
  async function goto(
    action: Store.ActionObject['fn'] | Store.BuiltInObject['fn'],
    opts: ConsumerOptions,
  ) {
    try {
      let destinationParam = ''
      let reload: boolean | undefined
      let pageReload: boolean | undefined // If true, gets passed to sdk initPage to disable the page object's "init" from being run
      let ndomPage = getNDOMPage(app, opts)
      let dataIn: any // sdk use

      let destProps: ReturnType<typeof app.parse.destination>
      let destination = ''
      let id = ''
      let isSamePage = false
      let duration = 350
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      throw err
    }
  }

  return goto
}

export default createGoto
