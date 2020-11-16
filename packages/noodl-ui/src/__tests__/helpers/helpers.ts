/**
 * NOTE: Contents in this file are planned to be moved to a separate JS package
 * once its core API is established
 * "noodl-test-utils"
 */
import {
  BuiltInActionObject,
  EmitActionObject,
  IComponentTypeInstance,
  IComponentTypeObject,
  IfObject,
  IList,
  NOODLComponent,
  NOODLPage,
  NOODLPageObject,
} from '../../types'
import { noodlui } from '../../utils/test-utils'

const EMPTY_PAGE = '__emptypage__'

type NOODLComponentArgs = Partial<NOODLComponent>

export function createImage(opts: NOODLComponentArgs) {
  return { type: 'image', ...opts } as NOODLComponent
}

export function createEmitObject({
  dataKey,
  actions,
}: {
  dataKey: any
  actions: any[]
}) {
  return { emit: { dataKey, actions } } as EmitActionObject
}

export function createPath(val: string): string
export function createPath(val: { cond: any; val1: any; val2: any }): IfObject
export function createPath(
  val: string | { cond: Function; val1: any; val2: any },
) {
  if (typeof val === 'string') {
    return val
  } else {
    return createIfObject(val.cond, val.val1, val.val2)
  }
}

export function createIfObject(cond: any, val1: any, val2: any): IfObject {
  return {
    if: [cond, val1, val2],
  } as IfObject
}

export function createBuiltInObject(
  args: Partial<BuiltInActionObject> & { [key: string]: any },
) {
  return {
    ...args,
    actionType: 'builtIn',
  }
}

export function getListItemWithEmit({
  iteratorVar = 'itemObject',
  viewTag,
}: NOODLComponentArgs) {
  return {
    type: 'listItem',
    [iteratorVar]: '',
    style: { top: '0.15', left: '0', width: '1' },
    viewTag,
    children: [
      {
        type: 'image',
        path: createPath({
          cond: {
            '.builtIn.object.has': [
              { object: '..formData' },
              { key: `${iteratorVar}.key` },
            ],
          },
          val1: 'selectOn.png',
          val2: 'selectOff.png',
        }),
        onClick: [
          createEmitObject({
            dataKey: { var1: iteratorVar, var2: iteratorVar },
            actions: [{}, {}, {}],
          }),
          createBuiltInObject({ funcName: 'redraw', viewTag }),
        ],
        style: { left: '0.15' },
      },
      {
        type: 'label',
        text: `${iteratorVar}.value`,
        style: { top: '0', left: '0.25', fontSize: '13' },
      },
    ],
  } as IComponentTypeObject
}

export function initiateListItems(list: IList) {
  if (typeof list?.getData === 'function') {
    const data = list.getData()
    list.set('listObject', [])
    data.forEach((d) => list.addDataObject(d))
  }
}

let util = {
  createBuiltInObject,
  createEmitObject,
  createIfObject,
  createImage,
  createPath,
  getListItemWithEmit,
  initiateListItems,
}

util = Object.entries(util).reduce((acc, [funcName, fn]) => {
  fn.toString = () => funcName
  acc[funcName] = fn
  return acc
}, {}) as typeof util

export type CreatePageResult = typeof util & {
  components: IComponentTypeInstance[]
}

class MockPage {
  name: string
  object: NOODLPageObject | null

  constructor(page: NOODLPage, opts: { actions: any[]; builtIns: any[] }) {
    this['name'] = Object.keys(page)[0]
    this.object = page[this.name]
  }

  createImage(opts: NOODLComponentArgs) {
    return { type: 'image', ...opts } as NOODLComponent
  }

  createList(opts: NOODLComponentArgs) {
    return { type: 'list', ...opts }
  }

  createListItem(opts: NOODLComponentArgs) {
    return { type: 'listItem', ...opts } as NOODLComponent
  }

  createView(opts: NOODLComponentArgs) {
    return { type: 'view', ...opts } as NOODLComponent
  }

  render(_components: any) {
    const renderChild = () => {}

    const components = Array.isArray(_components) ? _components : [_components]
    const resolvedComponents = noodlui.resolveComponents(components)

    const results = components.reduce(
      (acc, noodlComponent: NOODLComponent) => {
        if (noodlComponent.children) {
          if (Array.isArray(noodlComponent.children)) {
            noodlComponent.children.forEach((noodlChild) => {
              //
            })
          } else if (noodlComponent.children) {
            //
          }
        }
        acc.components.push(noodlComponent)
        return acc
      },
      { components: [] as IComponentTypeInstance[] },
    )

    return results
  }
}

export const createPage = function <K extends string>(
  cb: (args: typeof util) => NOODLPage,
) {
  let _page: { name: K | '' } = {
    name: '',
  }

  let state = {
    [_page.name as K]: {} as NOODLPageObject,
  }

  let consumerPage: NOODLPage | any
  let noodlComponents

  if (typeof cb === 'function') {
    consumerPage = cb(Object.assign({}, util))

    consumerPage?.components?.forEach((noodlComponent: any) => {
      let current = noodlComponent

      const onChildren = (children: NOODLComponent) => {
        if (Array.isArray(children)) {
          children.forEach((noodlChild) => {
            current.children.push(noodlChild)
            if (noodlChild.children) onChildren(noodlChild.children)
          })
        } else {
          if (Array.isArray(current.children)) {
            current.children.push(children)
          } else {
            current.children = children
          }
        }
      }
      noodlComponents.push(noodlComponent)
      if (noodlComponent.children(noodlComponent.children)) {
        onChildren(noodlComponent.children)
      }
    })
  } else if (cb && typeof cb === 'object') {
    _page['name'] = consumerPage.page?.name || ''
    state[_page.name] = consumerPage.page?.object || null

    if (consumerPage.actions) {
      const actionTypes = Object.keys(consumerPage.actions)
    }
    if (consumerPage.builtIns) {
      const funcNames = Object.keys(consumerPage.builtIns)
    }
  }

  // Parse the components and their inner funcs to the page object if available

  noodlui.setRoot(_page.name, state[_page.name]).setPage(_page.name)

  const o = {
    //
  }

  return (function () {
    const keys = Object.keys(consumerPage)
    if (keys.length === 1) {
      _page['name'] = keys[0] as K
      state[_page.name] = {
        ...consumerPage[_page.name],
        originalPage: consumerPage,
        components: noodlui.resolveComponents(
          consumerPage[_page.name]?.components,
        ),
      } as any
    } else {
      _page['name'] = EMPTY_PAGE as K
      state[EMPTY_PAGE] = {
        ...consumerPage,
        originalPage: consumerPage,
        components: noodlui.resolveComponents(consumerPage?.components),
      } as any
    }
    return Object.assign({} as CreatePageResult, state[_page.name], util)
  })()
}
