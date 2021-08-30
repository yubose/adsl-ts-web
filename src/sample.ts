import * as u from '@jsmanifest/utils'
import Logger from 'logsnap'
import h from 'virtual-dom/h'
import diff from 'virtual-dom/diff'
import createElement from 'virtual-dom/create-element'
import patch from 'virtual-dom/patch'
import VNode from 'virtual-dom/vnode/vnode'
import VText from 'virtual-dom/vnode/vtext'
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

  const leftNode = h('div', {})
  const rightNode = h('input', {})

  let rootNode = createElement(leftNode)

  this.document.body.appendChild(rootNode)

  const patches = diff(leftNode, rightNode)
  patch(rootNode, patches)

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
  let _rootNode = createElement(tree)
  document.body.appendChild(_rootNode)

  this.setInterval(function () {
    count++
    let newTree = render(count)
    let _patches = diff(tree, newTree)
    _rootNode = patch(_rootNode, _patches)
    tree = newTree
  }, 500)

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
