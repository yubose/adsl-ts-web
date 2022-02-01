import React from 'react'
import set from 'lodash/set'
import { triggers } from 'noodl-ui'
import camelCase from 'lodash/camelCase'
import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import type { NUITrigger } from 'noodl-ui'
import useActionChain from '@/hooks/useActionChain'
import useBuiltInFns from '@/hooks/useBuiltInFns'
import useCtx from '@/useCtx'
import usePageCtx from '@/usePageCtx'
import getTagName from '@/utils/getTagName'
import log from '@/utils/log'
import * as t from '@/types'
import * as c from '@/consts'

// TODO - Find out a better way to do this
export const noodlKeysToStrip = [
  'contentType',
  'image',
  'iteratorVar',
  'itemObject',
  'listObject',
  'parentId',
  'popUpView',
  'textBoard',
  'type',
  'viewTag',
  'videoFormat',
]

const keysToStrip = [...noodlKeysToStrip, 'index']

const keysToStripRegex = new RegExp(`(${keysToStrip.join('|')})`, 'i')

export interface RenderComponentCallbackArgs {
  component: t.StaticComponentObject
  element: React.ReactElement
  tagName: string
}

function useRenderer() {
  const { pages: root } = useCtx()
  const pageCtx = usePageCtx()
  const ac = useActionChain()
  const builtIns = useBuiltInFns()

  const renderComponent = React.useCallback(
    (componentProp: t.StaticComponentObject) => {
      let { id, type } = componentProp
      let props = { key: id } as Record<string, any>
      let children = [] as React.ReactElement[]

      for (let [key, value] of u.entries(componentProp)) {
        if (key === 'children') {
          if (!u.isArr(value)) value = u.array(value)
          children.push(...value.map((c) => renderComponent(c)))
        } else if (['popUpView', 'viewTag'].includes(key as string)) {
          set(props, `data-viewtag`, value)
        } else if (key === 'data-value') {
          if (componentProp['data-value']) {
            children.push(
              React.createElement(
                'div',
                { key: id },
                String(componentProp['data-value']),
              ),
            )
          } else {
            value && children.push(value)
          }
        } else if (key === 'data-src' && /(image|video)/i.test(type)) {
          props.src = value
        } else if (key === 'style') {
          if (u.isObj(value)) {
            props.style = {}
            for (let [styleKey, styleValue] of u.entries(value)) {
              if (u.isStr(styleKey) && styleKey.includes('-')) {
                props.style[camelCase(styleKey as string)] = styleValue
              } else {
                props.style[styleKey] = styleValue
              }
            }
          } else {
            log.error(
              `%cA value for style was received but it was not an object`,
              `color:#ec0000;`,
              componentProp,
            )
            props.style = {}
          }
        } else if (key === 'text' && !componentProp['data-value']) {
          value && children.push(value)
        } else if (triggers.includes(key as string)) {
          if (nt.userEvent.includes(key as typeof nt.userEvent[number])) {
            const obj = value as t.StaticComponentObject[NUITrigger]
            const actions = obj?.actions || []
            const trigger = key as NUITrigger
            const actionChain = ac.createActionChain(
              componentProp,
              trigger,
              actions,
            )
            props[trigger] = actionChain.execute.bind(actionChain)
          }
        } else {
          if (!keysToStripRegex.test(key as string)) {
            props[key] = value
          }
        }
      }

      const tagName = getTagName(type) || 'div'

      const element = React.createElement(
        tagName,
        props,
        children.length ? children : undefined,
      )

      return element
    },
    [pageCtx, root],
  )

  return {
    renderComponent,
  }
}

export default useRenderer
