import React from 'react'
import produce from 'immer'
import * as nt from 'noodl-types'
import { triggers, resolveAssetUrl } from 'noodl-ui'
import type { NUITrigger } from 'noodl-ui'
import { normalizeProps } from 'noodl-ui'
import { excludeIteratorVar, trimReference } from 'noodl-utils'
import get from 'lodash/get'
import * as u from '@jsmanifest/utils'
import useActionChain from '@/hooks/useActionChain'
import getTagName from '@/utils/getTagName'
import log from '@/utils/log'
import is from '@/utils/is'
import { getCurrent } from '@/utils/immer'
import useCtx from '@/useCtx'
import deref from '@/utils/deref'
import { usePageCtx } from '@/components/PageContext'
import type * as t from '@/types'

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

function useRenderer() {
  // Used to prevent infinite loops when dereferencing references
  const refsRef = React.useRef<Record<string, any>>({})
  const { getR, root, setR } = useCtx()
  const { createActionChain } = useActionChain()
  const {
    assetsUrl,
    baseUrl,
    getListObject,
    getCtxObject,
    getDataObject,
    getIteratorVar,
    isCtxObj,
    isListConsumer,
    lists,
    pageName,
    refs,
    slug,
  } = usePageCtx()

  const render = React.useCallback(
    (
      component: string | t.StaticComponentObject,
      componentPath: t.ComponentPath,
    ) => {
      if (u.isStr(component)) {
        if (is.reference(component)) {
          if (refsRef.current !== component) {
            refsRef.current = component
            return render(
              deref({ ref: component, rootKey: pageName, root }),
              componentPath,
            )
          }
        }
        return { type: 'div', children: component }
      }
      if (is.componentByReference(component)) {
        return render(u.keys(component)[0], componentPath)
      }

      if (!u.isObj(component)) return null

      let { dataKey, id, type } = component
      let children = [] as t.CreateElementProps<any>[]
      let iteratorVar = getIteratorVar?.(component)
      let elementType = getTagName(type) || 'div'

      id = id || dataKey

      let props = {
        type: elementType,
        key: id,
      } as t.CreateElementProps<any>

      component = {
        ...component,
        ...normalizeProps({}, component, { root, pageName }),
      }

      for (let [key, value] of u.entries(component)) {
        if (u.isStr(value) && is.reference(value)) {
          if (key === 'dataKey') value = trimReference(value)
          else {
            const ref = value
            props[key] = deref({ ref: value, root, rootKey: pageName })
            value = props[key]
            if (is.reference(value) && ref === value) {
              log.error(
                `The reference "${ref}" for key "${key}" was unresolved`,
                component,
              )
            }
          }
        }

        if (key === 'children') {
          u.array(value).forEach((child: t.StaticComponentObject, index) => {
            const nextPath = componentPath.concat('children', index)
            children.push(render(child, nextPath))
          })
        } else if (['popUpView', 'viewTag'].includes(key as string)) {
          props['data-viewtag'] = value
        } else if (key === 'data-value') {
          if (component['data-value']) {
            children.push(
              render(String(component['data-value']), componentPath),
            )
          } else {
            value && children.push(render(value, componentPath))
          }
        } else if (
          key === 'data-src' ||
          (key === 'path' && /(image|video)/i.test(type))
        ) {
          if (isListConsumer(component)) {
            const dataObject = getDataObject(component)
            props.src =
              u.isStr(component.path) && component.path.startsWith(iteratorVar)
                ? get(
                    dataObject,
                    excludeIteratorVar(component.path, iteratorVar),
                  )
                : value
            props['data-src'] = props.src
          } else {
            props.src = value
          }
        } else if (key === 'style') {
          if (u.isObj(value)) {
            if (!props.style) props.style = {}
            for (let [styleKey, styleValue] of u.entries(value)) {
              if (u.isStr(styleKey) && styleKey.includes('-')) {
                props.style[u.camelCase(styleKey as string)] = styleValue
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
              setR(getCurrent(nextRoot))
              return results
            }
          }
        } else {
          if (!keysToStripRegex.test(key as string)) props[key] = value
        }

        if (u.isStr(props[key])) {
          if (is.reference(value)) {
            props[key] = deref({ ref: value, root, rootKey: pageName })
          } else if (
            key !== 'data-key' &&
            iteratorVar &&
            value.startsWith(iteratorVar) &&
            key !== '_path_'
          ) {
            props[key] = getDataObject(component)
            debugger
          }
        }
      }

      if (children.length) props.children = children

      if (props._path_ && u.isStr(props._path_)) {
        if (props.type === 'img') {
          const dataObject = getDataObject(props, root, pageName)
          if (!dataObject) {
            // debugger
          } else {
            const src = get(
              dataObject,
              excludeIteratorVar(props._path_, iteratorVar),
            )
            if (src) {
              props.src = resolveAssetUrl(src, assetsUrl)
            }
          }
        }
      }

      return renderElement({ children, componentPath, ...props })
    },
    [assetsUrl, getDataObject, root],
  )

  const renderElement = React.useCallback(
    ({
      componentPath,
      type,
      key,
      children = [],
      ...rest
    }: t.CreateElementProps) => {
      let _children = [] as React.ReactElement[]
      let index = 0

      for (const cprops of u.array(children)) {
        const _path = (componentPath || []).concat('children', index)
        const renderKey = _path.join('.')

        if (u.isObj(cprops)) {
          const props = { ...cprops, componentPath: _path }
          _children.push(
            <React.Fragment key={renderKey}>
              {React.isValidElement(props) ? props : renderElement(props)}
            </React.Fragment>,
          )
        } else {
          _children.push(
            <React.Fragment key={renderKey}>{cprops}</React.Fragment>,
          )
        }
        index++
      }

      return React.createElement(
        type,
        rest,
        /img|input/.test(type)
          ? undefined
          : _children.length
          ? _children
          : undefined,
      )
    },
    [render, root],
  )

  return render
}

export default useRenderer
