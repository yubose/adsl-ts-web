import _ from 'lodash'
import sinon from 'sinon'
// import { createStore } from '@reduxjs/toolkit'
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
  NOODL,
  Viewport,
} from 'noodl-ui'
// import Page from 'Page'
// import { noodl } from 'app/client'
// import reducers from 'app/reducers'
// import createActions from 'handlers/actions'
// import createBuiltInActions from 'handlers/builtIns'

let logSpy: sinon.SinonStub

export let noodl: NOODL

before(async () => {
  logSpy = sinon.stub(global.console, 'log')

  const _viewport = new Viewport()
  // const _store = createStore(reducers)
  // const _app = new App({ store: _store, viewport: _viewport })
  // const _page = new Page({ store: _store })
  // const _actions = createActions({ store: _store, page: _page })
  // const _builtIn = createBuiltInActions({ store: _store, page: _page })
  noodl = new NOODL()
  noodl
    .init({ viewport: _viewport })
    .setAssetsUrl('https://aitmed.com/assets/')
    .setViewport({
      width: 375,
      height: 667,
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
  // .addLifecycleListener({
  //   action: _actions,
  //   builtIn: {
  //     checkUsernamePassword: _builtIn.checkUsernamePassword,
  //     enterVerificationCode: _builtIn.checkVerificationCode,
  //     goBack: _builtIn.goBack,
  //     lockApplication: _builtIn.lockApplication,
  //     logOutOfApplication: _builtIn.logOutOfApplication,
  //     logout: _builtIn.logout,
  //     signIn: _builtIn.signIn,
  //     signUp: _builtIn.signUp,
  //     signout: _builtIn.signout,
  //     toggleCameraOnOff: _builtIn.toggleCameraOnOff,
  //     toggleMicrophoneOnOff: _builtIn.toggleMicrophoneOnOff,
  //   },
  // } as any)
})

after(() => {
  logSpy.restore()
})
