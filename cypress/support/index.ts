// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

import {
  ActionChainActionCallback,
  getByDataUX,
  getElementType,
  getAlignAttrs,
  getBorderAttrs,
  getCustomDataAttrs,
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
  identify,
  IResolver,
  BuiltInObject,
  PageObject,
  Page,
  Resolver,
  ResolverFn,
  Viewport,
} from 'noodl-ui'
import noodl from '../../src/app/noodl'
import noodlui from '../../src/app/noodl-ui'

const viewport = new Viewport()
viewport.width = window.innerWidth
viewport.height = window.innerHeight

noodlui
  .init({ viewport })
  .setPage('SignIn')
  .use({
    getAssetsUrl: () => noodl?.assetsUrl || '',
    getRoot: () => noodl.root,
  })
  .use(
    [
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
      getCustomDataAttrs,
      getEventHandlers,
    ].reduce(
      (acc, r: ResolverFn) => acc.concat(new Resolver().setResolver(r)),
      [] as IResolver[],
    ),
  )
// .use(
//   _.reduce(
//     _.entries(actions),
//     (acc, [actionType, fn]) => acc.concat({ actionType, fn }),
//     [] as any[],
//   ),
// )
// .use(
//   _.map(
//     _.entries({
//       checkField: builtIn.checkField,
//       checkUsernamePassword: builtIn.checkUsernamePassword,
//       enterVerificationCode: builtIn.checkVerificationCode,
//       goBack: builtIn.goBack,
//       lockApplication: builtIn.lockApplication,
//       logOutOfApplication: builtIn.logOutOfApplication,
//       logout: builtIn.logout,
//       redraw: builtIn.redraw,
//       signIn: builtIn.signIn,
//       signUp: builtIn.signUp,
//       signout: builtIn.signout,
//       toggleCameraOnOff: builtIn.toggleCameraOnOff,
//       toggleFlag: builtIn.toggleFlag,
//       toggleMicrophoneOnOff: builtIn.toggleMicrophoneOnOff,
//     }),
//     ([funcName, fn]) => ({ funcName, fn }),
//   ),
// )
