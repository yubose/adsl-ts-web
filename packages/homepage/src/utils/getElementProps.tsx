import React from 'react'
import * as nt from 'noodl-types'
import * as u from '@jsmanifest/utils'
import type { NUITrigger } from 'noodl-ui'
import type useActionChain from '@/hooks/useActionChain'
import { triggers } from 'noodl-ui'
import { excludeIteratorVar } from 'noodl-utils'
import camelCase from 'lodash/camelCase'
import get from 'lodash/get'
import has from 'lodash/has'
import set from 'lodash/set'
import {
  createDraft,
  current as draftToCurrent,
  finishDraft,
  produce,
  produceWithPatches,
  applyPatches,
} from 'immer'
import getTagName from '@/utils/getTagName'
import deref from '@/utils/deref'
import log from '@/utils/log'
import * as t from '@/types'
import is from '@/utils/is'

export interface GetElementPropsUtils
  extends Pick<t.AppContext, 'root' | 'getR' | 'setR'>,
    t.PageContext {
  /**
   * By default this is coming from useActionChain but can be overrided
   */
  createActionChain?: ReturnType<typeof useActionChain>['createActionChain']
  /**
   * Path to the component starting from pageContext.pageObject.components
   */
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
    createActionChain,
    getR,
    getIteratorVar,
    getListDataObject,
    isListConsumer,
    pageName,
    path: componentPath = [],
    setR,
    root,
  } = utils

  if (u.isStr(component)) {
    if (is.reference(component)) {
      const referencedComponent = deref({
        ref: component,
        rootKey: pageName,
        root,
      })
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

    if (is.componentByReference(_component)) {
      return getElementProps(u.keys(_component)[0], utils)
    }

    let { dataKey, id, type } = _component
    let children = [] as t.CreateElementProps<Props>[]
    let iteratorVar = getIteratorVar?.(_component)
    let _isListConsumer = isListConsumer(_component)

    let props = {
      type: getTagName(type) || 'div',
      key: id || dataKey,
    } as t.CreateElementProps<Props>

    for (let [key, value] of u.entries(_component)) {
      if (key === 'children') {
        u.array(value).forEach((child: t.StaticComponentObject, index) => {
          children.push(
            getElementProps(child, {
              ...utils,
              path: componentPath.concat('children', index),
            }),
          )
        })
      } else if (['popUpView', 'viewTag'].includes(key as string)) {
        set(props, `data-viewtag`, value)
      } else if (key === 'data-value') {
        if (_component['data-value']) {
          children.push(
            getElementProps(String(_component['data-value']), utils),
          )
        } else {
          value && children.push(getElementProps(value, utils))
        }
      } else if (
        key === 'data-src' ||
        (key === 'path' && /(image|video)/i.test(type))
      ) {
        if (_isListConsumer) {
          const dataObject = getListDataObject(_component)
          props.src =
            u.isStr(_component.path) && _component.path.startsWith(iteratorVar)
              ? get(
                  dataObject,
                  excludeIteratorVar(_component.path, iteratorVar),
                )
              : value
          props['data-src'] = props.src
        } else {
          props.src = value
        }
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
          children.push(is.reference(value) ? getR(value, pageName) : value)
        // value && children.push(getElementProps(value, utils))
      } else if (triggers.includes(key as string)) {
        if (nt.userEvent.includes(key as typeof nt.userEvent[number])) {
          const obj = value as t.StaticComponentObject[NUITrigger]
          const actions = obj?.actions || []
          const trigger = key as NUITrigger
          const actionChain = createActionChain?.(component, trigger, actions)

          props[trigger] = async function onExecuteActionChain(
            evt: React.SyntheticEvent<HTMLElement>,
          ) {
            // This root draft will be used throughout the handlers instead of directly accessing root from context. This is to ensure that all the most recent changes are batched onto one single update
            let results: any[]
            // let clonedRoot = createDraft(cloneDeep(root))
            // actionChain?.data.set('rootDraft', clonedRoot)
            let changes = []
            let inverseChanges = []
            let nextRoot = await produce(
              root,
              async (draft) => {
                actionChain?.data.set('rootDraft', draft)
                try {
                  results = await actionChain?.execute(evt)
                } catch (error) {
                  log.error(
                    error instanceof Error ? error : new Error(String(error)),
                  )
                }
              },
              // The third argument to produce is a callback to which the patches will be fed
              (patches, inversePatches) => {
                changes.push(...patches)
                inverseChanges.push(...inversePatches)
              },
            )

            console.log({
              nextRoot,
              changes,
              inverseChanges,
            })

            actionChain?.data.delete('rootDraft')
            setR(nextRoot)
            return results
          }
        }
      } else {
        if (!keysToStripRegex.test(key as string)) props[key] = value
      }

      if (u.isStr(props[key])) {
        if (is.reference(value)) {
          props[key] = getR(value, pageName)
          if (props[key] === value) {
            log.error(
              `Tried to retrieve reference "${value}" for key "${key}" but the value stayed as the reference`,
            )
          }
        } else if (
          key !== 'data-key' &&
          iteratorVar &&
          value.startsWith(iteratorVar) &&
          key !== '_path_'
        ) {
          props[key] = getListDataObject(_component)
        }
      }
    }

    if (children.length) props.children = children

    if (props._path_ && u.isStr(props._path_)) {
      if (props.type === 'img') {
        // if
      }
    }

    return props
  }
}

export default getElementProps
