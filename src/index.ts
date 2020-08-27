import _ from 'lodash'
import { Account } from '@aitmed/cadl'
import {
  getElementType,
  getAlignAttrs,
  getBorderAttrs,
  getCustomDataAttrs,
  getChildren,
  getColors,
  getEventHandlers,
  getFontAttrs,
  getPosition,
  getReferences,
  getStylesByElementType,
  getSizes,
  getTransformedAliases,
  getTransformedStyleAliases,
  getDataValues,
  Page as NOODLUiPage,
  Viewport,
} from 'noodl-ui'
import { cadl, noodl } from './app/client'
import createStore from './app/store'
import createBuiltInActions, {
  videoChat as onVideoChatBuiltIn,
} from './handlers/builtIns'
import App from './App'
import Page from './Page'
import * as action from './handlers/actions'
import * as lifeCycle from './handlers/lifeCycles'
import './styles.css'

/**
 * Initialize the NOODL client / component resolver
 * @param { object } options -
 */
function initNOODLResolver(options: {
  builtIn: any
  page?: NOODLUiPage
  viewport?: Viewport
}) {
  const { builtIn, page, viewport } = options

  if (!noodl.initialized) {
    noodl
      .init({ viewport })
      .setResolvers([
        getElementType,
        getTransformedAliases,
        getReferences,
        getAlignAttrs,
        getBorderAttrs,
        getColors,
        getFontAttrs,
        getPosition,
        getSizes,
        getStylesByElementType,
        getTransformedStyleAliases,
        getChildren,
        getCustomDataAttrs,
        getEventHandlers,
      ])
      .addLifecycleListener({
        action: {
          evalObject: action.onEvalObject,
          goto: action.onGoto,
          pageJump: action.onPageJump,
          popUp: action.onPopUp,
          popUpDismiss: action.onPopUpDismiss,
          refresh: action.onRefresh,
          saveObject: action.onSaveObject,
          updateObject: action.onUpdateObject,
        },
        builtIn: {
          checkUsernamePassword: builtIn.checkUsernamePassword,
          enterVerificationCode: builtIn.checkVerificationCode,
          goBack: builtIn.goBack,
          lockApplication: builtIn.lockApplication,
          logOutOfApplication: builtIn.logOutOfApplication,
          logout: builtIn.logout,
          signIn: builtIn.signIn,
          signUp: builtIn.signUp,
          signout: builtIn.signout,
          toggleCameraOnOff: builtIn.toggleCameraOnOff,
          toggleMicrophoneOnOff: builtIn.toggleMicrophoneOnOff,
        },
        onChainStart: lifeCycle.onChainStart,
        onChainEnd: lifeCycle.onChainEnd,
        onChainError: lifeCycle.onChainError,
        onChainAborted: lifeCycle.onChainAborted,
        onAfterResolve: lifeCycle.onAfterResolve,
      } as any)
  }
  noodl
    .setRoot(cadl.root)
    .setAssetsUrl(cadl.assetsUrl || '')
    .setPage(page)
    .setViewport({
      width: window.innerWidth,
      height: window.innerHeight,
    })
}

window.addEventListener('load', async function hello() {
  window.account = Account
  window.env = process.env.ECOS_ENV
  window.getDataValues = getDataValues
  window.noodl = cadl
  // Auto login for the time being
  const vcode = await Account.requestVerificationCode('+1 8882465555')
  const profile = await Account.login('+1 8882465555', '142251', vcode || '')
  console.log(`%c${vcode}`, 'color:green;font-weight:bold;')
  console.log(`%cProfile`, 'color:green;font-weight:bold;', profile)
  // Initialize user/auth state, store, and handle initial route
  // redirections before proceeding
  const store = createStore()
  const viewport = new Viewport()
  const app = new App({ store, viewport })
  const page = new Page()
  const builtIn = createBuiltInActions({ store, page })

  page.setBuiltIn({
    goto: builtIn.goto,
    videoChat: onVideoChatBuiltIn,
  })

  const startPage = cadl?.cadlEndpoint?.startPage
  window.noodlui = app

  page.registerListener(
    'onBeforePageRender',
    async (noodlUiPage: NOODLUiPage) => {
      const previousPage = store.getState().page.previousPage
      const logMsg = `%c[App.tsx][onBeforePageRender] ${previousPage} --> ${noodlUiPage.name}`
      const logStyle = `color:#3498db;font-weight:bold;`
      console.log(logMsg, logStyle, { previousPage, nextPage: page })

      // Refresh the roots
      noodl
        // TODO: Leave root/page auto binded to the lib
        .setRoot(cadl.root)
        .setPage(noodlUiPage)

      // Make sure that the root node we are going to append to is being synced
      // before it begins rendering to the page
      if (page.rootNode && page.rootNode.id !== noodlUiPage.name) {
        page.rootNode.id = noodlUiPage.name
      }
    },
  )

  const pageSnapshot = {
    name: startPage,
    object: cadl?.root?.[startPage],
  }

  initNOODLResolver({
    viewport,
    page: pageSnapshot,
  })

  await app.initialize()
  await page.navigate(pageSnapshot.name)

  // Register the register once, if it isn't already registered
  if (viewport.onResize === undefined) {
    viewport.onResize = (newSizes) => {
      noodl.setViewport(newSizes)
      if (page.rootNode) {
        page.rootNode.style.width = `${newSizes.width}px`
        page.rootNode.style.height = `${newSizes.height}px`
        page.render(cadl?.root?.[store.getState().page.currentPage]?.components)
      } else {
        // TODO
      }
    }
  }
})
