import * as u from '@jsmanifest/utils'
import Logger from 'logsnap'
import {
  eventId as ndomEventId,
  findByDataAttrib,
  findByDataKey,
  findByElementId,
  findByGlobalId,
  findByPlaceholder,
  findBySelector,
  findBySrc,
  findByViewTag,
  findByUX,
  findWindow,
  findWindowDocument,
} from 'noodl-ui-dom'
/**
 * Just a helper to return the utilities that are meant to be attached
 * to the global window object
 */
export function getWindowHelpers() {
  return {
    findByDataAttrib,
    findByDataKey,
    findByElementId,
    findByGlobalId,
    findByPlaceholder,
    findBySelector,
    findBySrc,
    findByViewTag,
    findByUX,
    findWindow,
    findWindowDocument,
  }
}

const log = Logger.create('sample')

window.addEventListener('load', async function (evt) {
  log.func('load')
  log.green('DOM loaded', evt)

  const { default: App } = await import('./App')

  // const sdk = resetInstance()
  // await sdk.init()
  // await sdk.initPage('PaymentTest', [], {

  // })

  const app = new App({})
  await app.initialize()
  await app.navigate('AboutAitmed')

  this.window.app = app
  u.assign(window, getWindowHelpers())
  console.log(app)
})
