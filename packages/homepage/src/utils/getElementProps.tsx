import React from 'react'
import * as nt from 'noodl-types'
import * as u from '@jsmanifest/utils'
import type { NUITrigger } from 'noodl-ui'
import type useActionChain from '@/hooks/useActionChain'
import { triggers } from 'noodl-ui'
import camelCase from 'lodash/camelCase'
import cloneDeep from 'lodash/cloneDeep'
import { createDraft, current as draftToCurrent, finishDraft } from 'immer'
import set from 'lodash/set'
import {
  getListDataObject,
  getIteratorVar,
  isListConsumer,
} from '@/utils/pageCtx'
import getTagName from '@/utils/getTagName'
import log from '@/utils/log'
import * as t from '@/types'
import is from '@/utils/is'

export interface GetElementPropsUtils
  extends Pick<t.AppContext, 'root' | 'getInRoot' | 'setInRoot'> {
  _context_?: t.PageContext['_context_']
  createActionChain?: ReturnType<typeof useActionChain>['createActionChain']
  pageName?: string
  path?: (string | number)[]
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
    pageName,
    path: componentPath = [],
    setInRoot,
    root,
  } = utils

  if (u.isStr(component)) {
    if (is.reference(component)) {
      const referencedComponent = getInRoot(component, pageName)
      if (u.isObj(referencedComponent)) {
        return getElementProps(referencedComponent, utils)
      } else {
        log.error(
          `Tried to retrieve a component by reference but ` +
            `${typeof referencedComponent} was returned`,
          { reference: component, ...utils },
        )
      }
    }

    return { type: 'div', children: component }
  } else {
    let _component = component as t.StaticComponentObject

    if (is.componentByReference(component)) {
      console.log({ componentByReference: component, root })

      const refResult = getElementProps(u.keys(component)[0], utils)
      console.log({ refResult })
      return refResult
    }

    let { dataKey, id, type } = _component
    let iteratorVar = isListConsumer(_context_, _component)
      ? getIteratorVar(_context_, _component)
      : ''
    let props = {
      type: getTagName(type) || 'div',
      key: id || dataKey,
    } as t.CreateElementProps<Props>

    let children = [] as t.CreateElementProps<Props>[]

    if (component.type === 'list') {
      const _pathStr = componentPath.join('.')

      const refObject = u.values(_context_?.lists || {}).find((obj) => {
        const listObjectPath = obj?.listObjectPath
        return !!(listObjectPath && obj.path.join('.') === _pathStr)
      })

      if (refObject) {
        // const listObject = getInRoot(refObject.listObjectPath)
        // console.log(listObject)
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
        value &&
          children.push(
            is.reference(value) ? getInRoot(value, pageName) : value,
          )
        // value && children.push(getElementProps(value, utils))
      } else if (triggers.includes(key as string)) {
        if (nt.userEvent.includes(key as typeof nt.userEvent[number])) {
          const obj = value as t.StaticComponentObject[NUITrigger]
          const actions = obj?.actions || []
          const trigger = key as NUITrigger
          const actionChain = createActionChain?.(component, trigger, actions)
          props[trigger] = async function onActionChain(evt) {
            // This root draft will be used throughout the handlers instead of directly accessing root from context. This is to ensure that all the most recent changes are batched onto one single update
            let clonedRoot = createDraft(cloneDeep(root))
            let results: any[]
            actionChain.data.set('rootDraft', clonedRoot)
            try {
              results = await actionChain.execute(evt)
            } catch (error) {
              log.error(
                error instanceof Error ? error : new Error(String(error)),
              )
            } finally {
              clonedRoot = finishDraft(clonedRoot)
              actionChain.data.delete('rootDraft')
            }
            setInRoot((draft) => void u.assign(draft, clonedRoot))
            return results
          }
        }
      } else {
        if (!keysToStripRegex.test(key as string)) {
          props[key] = value
        }
      }

      if (u.isStr(props[key])) {
        if (is.reference(value)) {
          props[key] = getInRoot(value, pageName)
          if (props[key] === value) {
            log.error(
              `Tried to retrieve reference "${value}" for key "${key}" but the value stayed as the reference`,
            )
          }
        } else if (
          key !== 'data-key' &&
          iteratorVar &&
          value.startsWith(iteratorVar)
        ) {
          props[key] = getListDataObject(_context_?.lists, _component, utils)
        }
      }
    }

    if (children.length) props.children = children

    return props
  }
}

export default getElementProps
