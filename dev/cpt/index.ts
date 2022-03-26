import axios from 'axios'
import * as u from '@jsmanifest/utils'
import {
  h,
  init,
  toVNode,
  eventListenersModule,
  VNode,
  VNodeChildren,
} from 'snabbdom'
import {
  lf,
  clear,
  each,
  getKeys,
  getKeyCount,
  getItem,
  setItem,
  supportsIndexedDB,
  supportsWebSQL,
} from './lf'

const patch = init([eventListenersModule])

window.addEventListener('load', async function (evt) {
  const rootEl = document.getElementById('root')
  const rootVNode = toVNode(rootEl)

  const worker = new Worker(
    'piWorker.js',
    // @ts-expect-error
    import.meta.url,
  )

  worker.addEventListener('message', async function (evt) {
    console.log(`%c[client-Message] Message`, `color:#00b406;`, evt)
    const { data: msgData } = evt
    const data = (await axios.get(`http://127.0.0.1:3000/cpt`)).data
    const cptCodes = data?.CPT?.content

    if (u.isObj(msgData)) {
      if (msgData.type) {
        switch (msgData.type) {
          case 'REQUEST_STORE_DATA':
            return this.postMessage({
              type: 'REQUESTED_STORE_DATA',
              storeName: msgData.storeName,
              data: cptCodes,
            })
          case 'STORE_DATA':
            const { storeName, name, data } = msgData
            switch (storeName) {
              case 'cpt':
                const container = document.querySelector('ul')
                const cptCodes = data
                startListener('code', container, cptCodes)
                return renderResults(container, cptCodes)
            }
          default:
            break
        }
      }
    }
  })

  worker.addEventListener('messageerror', function (evt) {
    console.log(`%c[client-MessageError]`, `color:tomato;`, evt)
  })

  worker.addEventListener('error', function (evt) {
    console.log(`%c[client-Error]`, `color:tomato;`, evt)
  })
})

/**
 * @param { string } mode
 * @param { HTMLUListElement } container
 * @param { Record<string, string> } cptCodes
 */
function startListener(mode, container, cptCodes) {
  const startKeywordInputListener = () => {
    /** @type { HTMLInputElement } */
    const inputEl = document.querySelector(`input#search`) as HTMLInputElement
    const inputVNode = toVNode(inputEl)

    inputVNode.data.on = {
      input: [
        function (evt) {
          const value = inputEl.value
          switch (mode) {
            case 'code':
              if (value.length >= 4) {
                return filterByCode(container, value, cptCodes)
              } else if (!value) {
                return renderResults(container, cptCodes)
              }
              break
            case 'text':
              if (value.includes(' ')) {
                const [first, second, ...rest] = value
              }
              return filterByKeyword(container, value, cptCodes)
            default:
              break
          }
        },
      ],
      keydown: [
        function onKeyDown(this: VNode, evt: KeyboardEvent) {
          const el = this.elm as HTMLSelectElement
          if (evt.key === 'Enter') {
            if (el.value === '') {
              return renderResults(container, cptCodes)
            } else {
              return filterByCode(container, el.value, cptCodes)
            }
          }
        },
      ],
    }
    console.log(`Listening on keyword input element`)
    return patch(inputEl, inputVNode)
  }

  const startSelectListener = () => {
    const el = document.querySelector(
      `select[name=select-mode]`,
    ) as HTMLSelectElement
    const vnode = toVNode(el)
    const childrenVNodes = [...el.children].map((c) => toVNode(c)) as (
      | string
      | VNode
    )[]
    vnode.data.on = {
      change(this: VNode, evt: Event) {
        const evtTarget: any = evt.target
        const el = document.querySelector(
          `select[name=select-mode]`,
        ) as HTMLSelectElement
        console.log(`[select_onchange] New value: ${evtTarget.value}`)
        el.value = evtTarget.value
        startListener(evtTarget.value, container, cptCodes)
      },
    }
    vnode.children = []
    // @ts-expect-error
    vnode.children.push(childrenVNodes)
    console.log(`Listening on select element`)
    return patch(el, vnode)
  }

  startKeywordInputListener()
  startSelectListener()
}

/**
 * @param { HTMLElement } container
 * @param { string | number } code
 * @param { Record<string, string> } cptCodes
 */
function filterByCode(container, code, codes) {
  return renderResults(container, codes[code] ? { [code]: codes[code] } : {})
}

/**
 * @param { HTMLElement } container
 * @param { string | number } code
 * @param { Record<string, string> } cptCodes
 */
function filterByKeyword(container, keyword, codes) {
  return renderResults(
    container,
    keyword
      ? // @ts-expect-error
        u.entries(codes).reduce((acc, [code, desc]: [string, string]) => {
          if (code.includes(keyword)) acc[code] = desc
          return acc
        }, {})
      : codes,
  )
}

/**
 * @param { HTMLUListElement } container
 * @param { Record<string, string> } cptCodes
 */
function renderResults(container, cptCodes) {
  if (container.children.length) {
    for (const childNode of container.children) {
      container.removeChild(childNode)
    }
  }
  const sel = `${container.tagName.toLowerCase()}#${container.id}`
  const vnode = h(
    sel,
    u.entries(cptCodes).map(([code, description]) => {
      return h('li', `${code as string}: ${description}`)
    }),
  )

  patch(toVNode(container), vnode)
}
