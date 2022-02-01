import React from 'react'
import * as nt from 'noodl-types'
import * as u from '@jsmanifest/utils'
import type { NUITrigger } from 'noodl-ui'
import type useActionChain from '@/hooks/useActionChain'
import { triggers } from 'noodl-ui'
import camelCase from 'lodash/camelCase'
import set from 'lodash/set'
import getTagName from '@/utils/getTagName'
import log from '@/utils/log'
import * as t from '@/types'

export interface GetElementPropsUtils {
  _context_: t.PageContext['_context_']
  createActionChain: ReturnType<typeof useActionChain>['createActionChain']
  getInRoot: t.AppContext['get']
  path?: (string | number)[]
  root: t.AppContext['pages']
  setInRoot: t.AppContext['set']
}

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

const keysToStrip = noodlKeysToStrip.concat('index')
const keysToStripRegex = new RegExp(`(${keysToStrip.join('|')})`, 'i')

function getElementProps<Props = any>(
  component: Partial<t.StaticComponentObject> | string,
  utils = {} as GetElementPropsUtils,
): t.CreateElementProps {
  let {
    _context_,
    createActionChain,
    getInRoot,
    path: componentPath = [],
    setInRoot,
    root,
  } = utils

  if (u.isStr(component)) {
    return {
      type: 'div',
      children: component,
    }
  } else {
    let { dataKey, id, type } = component

    let props = {
      type: getTagName(type) || 'div',
      key: id || dataKey,
    } as t.CreateElementProps<Props>

    let children = [] as t.CreateElementProps<Props>[]

    if (component.type === 'list') {
      const _pathStr = componentPath.join('.')

      const refObject = u.values(_context_.lists).find((obj) => {
        const listObjectPath = obj?.listObjectPath
        return !!(listObjectPath && obj.path.join('.') === _pathStr)
      })

      if (refObject) {
        component.children.forEach((child) => {
          // child[component.iteratorVar] = getInRoot(refObject.listObjectPath)
        })

        // debugger
      }
    }

    for (let [key, value] of u.entries(component)) {
      if (key === 'children') {
        if (!u.isArr(value)) value = u.array(value)
        const numChildren = value.length
        for (let index = 0; index < numChildren; index++) {
          const c = value[index]
          children.push(
            getElementProps(c, {
              ...utils,
              path: componentPath.concat('children', index),
            }),
          )
        }
      } else if (['popUpView', 'viewTag'].includes(key as string)) {
        set(props, `data-viewtag`, value)
      } else if (key === 'data-value') {
        if (component['data-value']) {
          children.push(getElementProps(String(component['data-value']), utils))
        } else {
          value && children.push(getElementProps(value, utils))
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
            component,
          )
          props.style = {}
        }
      } else if (key === 'text' && !component['data-value']) {
        value && children.push(getElementProps(value, utils))
      } else if (triggers.includes(key as string)) {
        if (nt.userEvent.includes(key as typeof nt.userEvent[number])) {
          const obj = value as t.StaticComponentObject[NUITrigger]
          const actions = obj?.actions || []
          const trigger = key as NUITrigger
          const actionChain = createActionChain?.(component, trigger, actions)
          props[trigger] = actionChain.execute.bind(actionChain)
        }
      } else {
        if (!keysToStripRegex.test(key as string)) {
          props[key] = value
        }
      }
    }

    if (children.length) props.children = children

    return props
  }
}

export default getElementProps
