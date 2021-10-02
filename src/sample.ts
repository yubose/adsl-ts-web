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
import {
  download,
  exportToPDF,
  getDataUrl,
  screenshotElement,
} from './utils/dom'
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

  const title = 'patient chart for the next 3 months'
  const content =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce ut aliquam diam, nec luctus magna. Aenean et augue non felis euismod molestie id faucibus ligula. Phasellus a augue sed dui molestie finibus. Cras sit amet semper est. Ut hendrerit fermentum facilisis. Suspendisse nec mi eget dui varius lobortis vel non ipsum. Morbi id risus lacus. Nunc porttitor nisl quis lacinia porta.'

  // await exportToPDF({ data: { title, content }, open: true })

  const img = document.createElement('img')
  img.src = 'ava.png'
  img.style.width = '375px'
  this.document.body.appendChild(img)

  img.addEventListener('load', async function (evt) {
    await exportToPDF({
      data: 'http://localhost:3000/ava.png',
      labels: true,
      filename: title,
      open: true,
    })
  })

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
