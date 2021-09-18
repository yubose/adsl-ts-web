// @ts-nocheck
import { OrArray } from '@jsmanifest/typefest'
import get from 'lodash/get'
import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import * as nu from 'noodl-utils'
import * as c from './constants'
import * as t from './types'
import isNuiPage from './utils/isPage'
import NuiPage from './Page'
import NuiTransformer from './Transformer'
import nui from './noodl-ui'

function createResolveComponents({
  createComponent,
  getRootPage,
  transform,
}: {
  createComponent: typeof nui['createComponent']
  getRootPage: typeof nui['getRootPage']
  transform: NuiTransformer['transform']
}) {
  async function resolveComponents<
    C extends OrArray<t.NuiComponent.CreateType>,
    Context extends Record<string, any> = Record<string, any>,
  >(
    opts: t.ResolveComponentOptions<C, Context>,
  ): Promise<
    C extends any[] ? t.NuiComponent.Instance[] : t.NuiComponent.Instance
  >

  async function resolveComponents<
    C extends OrArray<t.NuiComponent.CreateType>,
    Context extends Record<string, any> = Record<string, any>,
  >(
    component: C,
    page?: NuiPage,
    callback?:
      | t.ResolveComponentOptions<C, Context>['callback']
      | t.ResolveComponentOptions<C, Context>,
  ): Promise<
    C extends any[] ? t.NuiComponent.Instance[] : t.NuiComponent.Instance
  >

  async function resolveComponents<
    C extends OrArray<t.NuiComponent.CreateType>,
    Context extends Record<string, any> = Record<string, any>,
  >(
    component: C,
    callback?: t.ResolveComponentOptions<C, Context>['callback'],
  ): Promise<
    C extends any[] ? t.NuiComponent.Instance[] : t.NuiComponent.Instance
  >

  async function resolveComponents<
    C extends OrArray<t.NuiComponent.CreateType>,
    Context extends Record<string, any> = Record<string, any>,
  >(
    component: C,
    options?: Omit<t.ResolveComponentOptions<C, Context>, 'component'>,
  ): Promise<
    C extends any[] ? t.NuiComponent.Instance[] : t.NuiComponent.Instance
  >

  async function resolveComponents<
    C extends OrArray<t.NuiComponent.CreateType>,
    Context extends Record<string, any> = Record<string, any>,
  >(
    ...args: [
      arg1: C | t.ResolveComponentOptions<C, Context>,
      arg2?:
        | NuiPage
        | t.ResolveComponentOptions<C, Context>['callback']
        | Omit<t.ResolveComponentOptions<C, Context>, 'component'>,
      arg3?:
        | Omit<t.ResolveComponentOptions<C, Context>, 'component'>
        | t.ResolveComponentOptions<C, Context>['callback'],
    ]
  ) {
    function getArgs(
      arg1: C | t.ResolveComponentOptions<C, Context>,
      arg2?:
        | NuiPage
        | t.ResolveComponentOptions<C, Context>['callback']
        | Omit<t.ResolveComponentOptions<C, Context>, 'component'>,
      arg3?:
        | Omit<t.ResolveComponentOptions<C, Context>, 'component'>
        | t.ResolveComponentOptions<C, Context>['callback'],
    ) {
      let components: t.NuiComponent.CreateType[] = []
      let page: NuiPage | undefined
      let context: Record<string, any> = {}
      let callback:
        | t.ResolveComponentOptions<C, Context>['callback']
        | undefined
      let on: t.ResolveComponentOptions<C, Context>['on'] | undefined

      if (u.isArr(arg1)) {
        components = arg1
        if (u.isFnc(arg2)) {
          callback = arg2
          if (isNuiPage(arg3)) page = arg3
          else page = getRootPage()
        } else if (isNuiPage(arg2)) {
          page = arg2
        } else if (u.isObj(arg2)) {
          arg2.callback && (callback = arg2.callback)
          arg2.context && (context = arg2.context)
          arg2.page && (page = arg2.page)
          arg2.on && (on = arg2.on)
        }
        if (u.isFnc(arg3)) {
          callback = arg3
        } else if (u.isObj(arg3)) {
          arg3.on && (on = arg3.on)
          arg3.callback && (callback = arg3.callback)
          arg3.context && (context = arg3.context)
          isNuiPage(arg3.page) && (page = arg3.page)
        }
      } else if (u.isObj(arg1)) {
        if ('type' in arg1 || 'children' in arg1 || 'style' in arg1) {
          components = [arg1]
          if (u.isFnc(arg2)) {
            callback = arg2
          } else if (isNuiPage(arg2)) {
            page = arg2
          } else if (u.isObj(arg2)) {
            isNuiPage(arg2.page) && (page = arg2.page)
            arg2.context && (context = arg2.context)
            arg2.callback && (callback = arg2.callback)
            arg2.on && (on = arg2.on)
          }
          if (u.isFnc(arg3)) {
            callback = arg3
          } else if (u.isObj(arg3)) {
            isNuiPage(arg3.page) && (page = arg3.page)
            arg3.context && (context = arg3.context)
            arg3.callback && (callback = arg3.callback)
            arg3.on && (on = arg3.on)
          }
          isArr = false
        } else {
          arg1.callback && (callback = arg1.callback)
          arg1.context && u.assign(context, arg1.context)
          arg1.page && (page = arg1.page)
          arg1.on && (on = arg1.on)
          components = u.array(arg1.components)
          isArr = u.isArr(arg1.components)
        }
      }
      return {
        callback,
        context,
        components,
        page,
        on,
      }
    }

    async function xform(
      c: t.NuiComponent.Instance,
      cb?: t.ResolveComponentOptions<C, Context>['callback'],
      on?: t.ResolveComponentOptions<C, Context>['on'],
    ) {
      const options = getConsumerOptions({
        callback: cb,
        component: c,
        on,
        page: page as NuiPage,
        context,
      })
      await transform(c, options)
      const iteratorVar = options?.context?.iteratorVar || ''
      const isListConsumer =
        iteratorVar && u.isObj(options?.context?.dataObject)

      for (const [key, value] of u.entries(c.props)) {
        if (key === 'style') {
          // TODO - Put these finalizers into a curry utility func. This is temp. hardcoded for now
          if (isListConsumer) {
            if (u.isObj(value)) {
              for (let [styleKey, styleValue] of u.entries(value)) {
                // if (u.isStr(value) && vpHeightKeys.includes(key as any)) {
                if (u.isStr(styleValue)) {
                  if (styleValue.startsWith(iteratorVar)) {
                    const dataKey = nu.excludeIteratorVar(
                      styleValue,
                      iteratorVar,
                    ) as string
                    const cachedValue = styleValue
                    styleValue = get(options.context?.dataObject, dataKey)
                    if (styleValue) {
                      c.edit({ style: { [styleKey]: styleValue } })
                    } else {
                      console.log(
                        `%cEncountered an unparsed style value "${cachedValue}" for style key "${styleKey}"`,
                        `color:#ec0000;`,
                        { component: c, possibleValue: styleValue },
                      )
                    }
                  } else if (nt.Identify.reference(value)) {
                    console.log(
                      `%cEncountered an unparsed style value "${value}" for style key "${key}"`,
                      `color:#ec0000;`,
                      c,
                    )
                  }
                }
                // }
              }
            }
          }
        } else {
          if (nt.Identify.reference(value)) {
            console.log(
              `%cEncountered an unparsed style value "${value}" for style key "${key}"`,
              `color:#ec0000;`,
              c,
            )
          }
        }
      }

      return c
    }

    let isArr = true
    let { callback, components, on, page } = getArgs(...args)
    let resolvedComponents: t.NuiComponent.Instance[] = []

    !page && (page = getRootPage())

    const componentsList = u.array(components)
    const numComponents = componentsList.length

    for (let index = 0; index < numComponents; index++) {
      resolvedComponents.push(
        await xform(
          createComponent(componentsList[index], page as NuiPage),
          callback,
          on,
        ),
      )
    }

    return (
      isArr ? resolvedComponents : resolvedComponents[0]
    ) as C extends any[] ? t.NuiComponent.Instance[] : t.NuiComponent.Instance
  }

  return resolveComponents
}

export default createResolveComponents
