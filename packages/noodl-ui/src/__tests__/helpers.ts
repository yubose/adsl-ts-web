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
} from '../types'
import { noodlui } from '../utils/test-utils'

const EMPTY_PAGE = '__empty.page__'

type NOODLComponentArgs = Partial<NOODLComponent>

export function createImageComponent(opts: NOODLComponentArgs) {
  return { type: 'image', ...opts } as NOODLComponent
}

export function createEmitObject({ dataKey, actions }: any) {
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

export function getRedrawBuiltInObject({ viewTag }: NOODLComponentArgs) {
  return {
    actionType: 'builtIn',
    funcName: 'redraw',
    viewTag,
  } as BuiltInActionObject
}

export function getEmitObject({
  iteratorVar,
  ...rest
}: {
  iteratorVar: string
  [key: string]: any
}) {
  return {
    ...rest,
    emit: {
      dataKey: {
        var1: iteratorVar,
      },
      actions: [
        {
          if: [
            {
              '.builtIn.object.has': [{ object: '..pmh' }, { key: 'var1.key' }],
            },
            {
              '.builtIn.object.remove': [
                { object: '..pmh' },
                { key: 'var1.key' },
              ],
            },
            {
              '.builtIn.object.set': [
                { object: '..pmh' },
                { key: 'var1.key' },
                { value: 'var1.value' },
              ],
            },
          ],
        },
      ],
    },
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
          getEmitObject({ iteratorVar }),
          getRedrawBuiltInObject({ viewTag }),
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
  createEmitObject,
  createIfObject,
  createImageComponent,
  createPath,
  getEmitObject,
  getListItemWithEmit,
  getRedrawBuiltInObject,
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

export const createPage = function <K extends string>(
  cb: (args: typeof util) => NOODLPage,
) {
  let _page: { name: K | '' } = {
    name: '',
  }

  let state = {
    [_page.name as K]: {} as NOODLPageObject,
  }

  const consumerPage = cb(Object.assign({}, util))

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
        components: noodlui.resolveComponents(
          consumerPage[_page.name]?.components,
        ),
      } as any
    } else {
      _page['name'] = EMPTY_PAGE as K
      state[EMPTY_PAGE] = {
        ...consumerPage,
        components: noodlui.resolveComponents(consumerPage?.components),
      } as any
    }
    return Object.assign({} as CreatePageResult, state[_page.name], util)
  })()
}
