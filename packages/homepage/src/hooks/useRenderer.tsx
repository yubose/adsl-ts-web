import React from 'react'
import set from 'lodash/set'
import { triggers } from 'noodl-ui'
import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import type { NUITrigger } from 'noodl-ui'
import useActionChain from '@/hooks/useActionChain'
import useBuiltInFns from '@/hooks/useBuiltInFns'
import getTagName from '@/utils/getTagName'
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
  const ac = useActionChain()
  const builtIns = useBuiltInFns()

  const renderComponent = React.useCallback(
    (
      componentProp: t.StaticComponentObject,
      pageContext,
      // cb?: (args: RenderComponentCallbackArgs) => void,
    ) => {
      let { id, type, style } = componentProp
      let props = { key: id, style } as Record<string, any>
      let children = [] as React.ReactElement[]

      for (let [key, value] of u.entries(componentProp)) {
        if (key === 'children') {
          if (!u.isArr(value)) value = u.array(value)
          children.push(...value.map((c) => renderComponent(c, pageContext)))
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
          //
        } else if (key === 'text' && !componentProp['data-value']) {
          value && children.push(value)
        } else if (triggers.includes(key as string)) {
          if (key === 'onClick') {
            const obj = value as t.StaticComponentObject[NUITrigger]
            const actions = obj?.actions || []
            const trigger = key as NUITrigger
            const actionChain = ac.createActionChain(trigger, actions)
            props[trigger] = actionChain.execute.bind(actionChain)
            const { dataObject } =
              pageContext?.componentMap?.[id]?.context || {}
            if (dataObject) actionChain.data.set('dataObject', dataObject)
            // debugger
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

      // cb?.({ component: componentProp, element, tagName })

      return element
    },
    [],
  )

  return {
    renderComponent,
  }
}

export default useRenderer
