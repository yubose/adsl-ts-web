import * as u from '@jsmanifest/utils'
import Logger from 'logsnap'
import yaml from 'yaml'
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

  // const { default: App } = await import('./App')

  // const sdk = resetInstance()
  // await sdk.init()
  // await sdk.initPage('PaymentTest', [], {

  // })

  // const app = new App({})
  // await app.initialize()
  // await app.navigate('AboutAitmed')

  // this.window.app = app
  // u.assign(window, getWindowHelpers())
  // console.log(app)
})

/**
 *
  const leftNode = h('div', {})
  const rightNode = h('input', {})

  let node = createElement(leftNode)

  this.document.body.appendChild(node)

  const patches = diff(leftNode, rightNode)
  patch(node, patches)

  console.log(patches)

  function render(count) {
    return h(
      'div',
      {
        style: {
          textAlign: 'center',
          lineHeight: 100 + count + 'px',
          border: '1px solid red',
          width: 100 + count + 'px',
          height: 100 + count + 'px',
        },
      },
      ['asfas', h('input')],
    )
  }

  let count = 0
  let tree = render(count)
  let _node = createElement(tree)
  document.body.appendChild(_node)

  this.setInterval(function () {
    count++
    let newTree = render(count)
    let _patches = diff(tree, newTree)
    _node = patch(_node, _patches)
    tree = newTree
  }, 500)
 */
