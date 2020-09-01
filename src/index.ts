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
import createBuiltInActions, { onVideoChatBuiltIn } from './handlers/builtIns'
import App from './App'
import Page from './Page'
import Meeting from './Meeting'
import * as action from './handlers/actions'
import * as lifeCycle from './handlers/lifeCycles'
import './styles.css'

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
  const page = new Page({ store })
  const meeting = new Meeting({ page, store, viewport })
  const app = new App({ store, viewport })
  const builtIn = createBuiltInActions({ page, store, viewport })

  const { startPage } = await app.initialize()

  page.setBuiltIn({
    goto: builtIn.goto,
    videoChat: onVideoChatBuiltIn(meeting.joinRoom),
  })

  page.registerListener('onBeforePageChange', () => {
    if (!noodl.initialized) {
      noodl
        .init({ viewport })
        .setAssetsUrl(cadl.assetsUrl || '')
        .setViewport({
          width: window.innerWidth,
          height: window.innerHeight,
        })
        .setResolvers(
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
          getChildren as any,
          getCustomDataAttrs,
          getEventHandlers,
        )
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
  })

  page.registerListener(
    'onBeforePageRender',
    async (noodlUiPage: NOODLUiPage) => {
      const previousPage = store.getState().page.previousPage
      const logMsg =
        `%c[App.tsx][onBeforePageRender] ` +
        `${previousPage} --> ${noodlUiPage.name}`
      console.log(logMsg, `color:green;font-weight:bold;`, {
        previousPage,
        nextPage: page,
      })
      // Refresh the roots
      noodl
        // TODO: Leave root/page auto binded to the lib
        .setRoot(cadl.root)
        .setPage(noodlUiPage)
      // NOTE: not being used atm
      if (page.rootNode && page.rootNode.id !== noodlUiPage.name) {
        page.rootNode.id = noodlUiPage.name
      }
    },
  )

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

  const { snapshot } = await page.navigate(startPage)

  if (snapshot.name === 'VideoChat') {
    // TODO: connect to meeting
  } else {
    //
  }
})
