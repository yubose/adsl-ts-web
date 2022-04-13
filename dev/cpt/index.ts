import * as u from '@jsmanifest/utils'
import { h, init, toVNode, eventListenersModule, VNode } from 'snabbdom'
import unset from 'lodash/unset'
import { c } from 'noodl-pi'
// import * as jss from 'jsstore'
// import SqlWeb from 'sqlweb'

const table = {
  cpt: 'CPT',
  cptMod: 'CPTMod',
} as const

const _color = 'navajowhite'
const storeNames = [table.cpt]
const patch = init([eventListenersModule])

let listEl: HTMLUListElement
let cptCodes: Record<string, string>

const withSendMessage = (worker) => {
  Object.defineProperty(worker, 'sendMessage', {
    value: function (...args) {
      console.log(`%c[client] Sending "${args[0]?.type}"`, `color:${_color};`)
      return this.postMessage(...args)
    },
  })
  return worker as Worker & { sendMessage: Worker['postMessage'] }
}

window.addEventListener('load', async (evt) => {
  const worker = withSendMessage(new Worker('piWorker.js'))

  listEl = document.querySelector('ul') as HTMLUListElement
  console.log(`%c[client] Worker constructed`, `color:${_color};`, worker)

  worker.addEventListener('message', async (evt2) => {
    const data = evt2.data
    const type = data?.type

    if (evt2.data?.result?.database) {
      // Message sent from jsstore
      const { isCreated, database, oldVersion, newVersion } = evt2.data.result
      if (isCreated) {
        // First time instantiation
        console.log(
          `%c[client] Database "${database.name}" created with ${database.tables.length} tables`,
          `color:${_color};`,
          database,
        )
      } else {
        console.log(
          `%c[client] Database tables`,
          `color:${_color};`,
          database.tables,
        )
      }
    } else {
      console.log(`%c[client] Message "${type}"`, `color:${_color};`, data)
    }

    if (type) {
      switch (type) {
        case 'workerInitiated': {
          return storeNames.forEach((storeName) =>
            worker.sendMessage({
              type: c.storeEvt.SEARCH,
              storeName,
            }),
          )
        }
        case c.storeEvt.SEARCH_RESULT: {
          cptCodes = data.result
          startListener('code')
          return renderResults()
        }
        case c.storeEvt.FETCHED_STORE_DATA: {
          const { storeName, cachedVersion, response } = data
          const responseDataVersion = response?.CPT?.version
          if (responseDataVersion && cachedVersion !== responseDataVersion) {
            return worker.sendMessage({
              type: c.storeEvt.STORE_DATA_VERSION_UPDATE,
              storeName,
              data: response?.CPT?.content,
              version: responseDataVersion,
            })
          }
          break
        }

        case c.TABLE_CONTENTS: {
          switch (data.storeName) {
            case table.cpt: {
              if (data.value) cptCodes = data.value
              else throw new Error(`Did not receive data for CPT codes`)
              startListener('code')
              return renderResults()
            }
          }
          break
        }
        case c.TABLE_NOT_FOUND: {
          switch (data.storeName) {
            case table.cpt:
              const resp = await (
                await fetch(`http://127.0.0.1:3000/cpt`)
              ).json()
              cptCodes = resp.data?.[table.cpt]?.content
              worker.sendMessage({
                type: c.SET_STORE_DATA,
                storeName: data.storeName,
                version: resp.data[table.cpt]?.version,
                data: resp.data[table.cpt]?.content,
              })
              startListener('code')
              return renderResults()
          }
        }
      }
    }
  })
  worker.addEventListener('messageerror', function (evt2) {
    console.log(`%c[client] MessageError`, `color:tomato;`, evt2)
  })
  worker.addEventListener('error', function (evt2) {
    console.log(`%c[client] Error`, `color:tomato;`, evt2)
  })
})

function startListener(mode) {
  const startKeywordInputListener = () => {
    const inputEl = document.querySelector(`input#search`) as HTMLInputElement
    const inputVNode = toVNode(inputEl)
    unset(inputVNode, 'data.on.input')
    unset(inputVNode, 'data.on.keydown')
    if (!inputVNode.data) inputVNode.data = {}
    inputVNode.data.on = {
      input: [
        function (evt) {
          const value = inputEl.value
          switch (mode) {
            case 'code':
              if (value.length >= 4) {
                return filterBy('code', value)
              } else if (!value) {
                return renderResults()
              }
              break
            case 'text':
              if (value.includes(' ')) {
                const [first, second, ...rest] = value
              }
              return filterBy('keyword', value)
            default:
              break
          }
        },
      ],
      keydown: [
        function onKeyDown(this: VNode, evt) {
          const el = this.elm as HTMLInputElement
          if (evt.key === 'Enter') {
            if (el.value === '') {
              return renderResults()
            } else {
              return filterBy('code', el.value)
            }
          }
        },
      ],
    }
    console.log(
      `%c[client] Listening on keyword input element`,
      `color:${_color};`,
    )
    return patch(inputEl, inputVNode)
  }

  const startSelectListener = () => {
    const el = document.querySelector(
      `select[name=select-mode]`,
    ) as HTMLSelectElement

    const vnode = toVNode(el)
    const childrenVNodes = [...el.children].map((c2) => toVNode(c2))

    unset(vnode, 'data.on.change')

    if (!vnode.data) vnode.data = {}
    vnode.data.on = {
      change(this: VNode, evt) {
        const evtTarget = evt.target as any
        const el2 = document.querySelector(
          `select[name=select-mode]`,
        ) as HTMLSelectElement
        console.log(
          `%c[client] New value: ${evtTarget.value}`,
          `color:${_color}`,
        )
        el2.value = evtTarget.value
        startListener(evtTarget.value)
      },
    }
    vnode.children = [] as VNode[]
    vnode.children.push(childrenVNodes as any)
    console.log(`%c[client] Listening on select element`, `color:${_color};`)
    return patch(el, vnode)
  }
  const startClearButtonListener = () => {
    const clearBtn = document.getElementById('clear') as HTMLButtonElement
    clearBtn.onclick = (evt) => {
      window.indexedDB.deleteDatabase('noodl')
      window.location.reload()
    }
  }

  startKeywordInputListener()
  startSelectListener()
  startClearButtonListener()
}

function filterBy(filterType: 'code' | 'keyword', args: any) {
  switch (filterType) {
    case 'code':
      return renderResults(cptCodes[args] ? { [args]: cptCodes[args] } : {})
    case 'keyword':
      return renderResults(
        args
          ? u.entries(cptCodes).reduce((acc, [code, desc]) => {
              if (code.includes(args)) acc[code] = desc
              return acc
            }, {})
          : cptCodes,
      )
    default:
      return cptCodes
  }
}

function renderResults(codes = cptCodes) {
  if (listEl.children.length) {
    for (const childNode of listEl.children) {
      listEl.removeChild(childNode)
    }
  }

  const sel = `${listEl.tagName.toLowerCase()}#${listEl.id}`
  const vnode = h(
    sel,
    u.entries(codes).map(([code, description]) => {
      return h('li', `${code}: ${description}`)
    }),
  )

  patch(toVNode(listEl), vnode)
}
