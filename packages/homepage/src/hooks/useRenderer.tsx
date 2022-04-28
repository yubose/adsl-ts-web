import * as u from '@jsmanifest/utils'
import React from 'react'
import produce from 'immer'
import get from 'lodash/get'
import set from 'lodash/set'
import * as nt from 'noodl-types'
import { triggers } from 'noodl-ui'
import type { NUITrigger } from 'noodl-ui'
import { excludeIteratorVar } from 'noodl-utils'
import deref from '@/utils/deref'
import getTagName from '@/utils/getTagName'
import log from '@/utils/log'
import is from '@/utils/is'
import useCtx from '@/useCtx'
import useActionChain from '@/hooks/useActionChain'
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
  const { root, getR, setR } = useCtx()
  const { createActionChain } = useActionChain()
  const pageCtx = usePageCtx()

  const {
    getListsCtxObject,
    getIteratorVar,
    getListObject,
    getListDataObject,
    isListConsumer,
    lists,
    pageName,
    pageObject,
    refs,
    slug,
    startPage,
  } = pageCtx

  const render = React.useCallback(
    (
      component: string | t.StaticComponentObject,
      pathsProp: t.ComponentPath = [],
    ) => {
      let reference: string | undefined

      if (u.isStr(component)) {
        if (is.reference(component)) {
          reference = component

          const referencedComponent = deref({
            paths: pathsProp,
            ref: component,
            rootKey: pageName,
            root,
          })

          if (u.isObj(referencedComponent)) {
            return render(referencedComponent as any, pathsProp)
          } else {
            log.error(
              `Did not receive a component object using path referenced in ` +
                `"${reference}". Received a(n) "${typeof component}" instead`,
              { paths: pathsProp, reference },
            )
          }
        }

        return { type: 'div', children: component }
      }

      if (!u.isObj(component)) return null

      if (is.componentByReference(component)) {
        return render(u.keys(component)[0], pathsProp)
      }

      let { dataKey, id, type } = component
      let children = [] as t.CreateElementProps<any>[]
      let iteratorVar = getIteratorVar?.(component)
      let _isListConsumer = isListConsumer(component)

      const props = {
        type: getTagName(type) || 'div',
        key: id || dataKey,
      } as t.CreateElementProps<any>

      for (let [key, value] of u.entries(component)) {
        if (key === 'children') {
          u.array(value).forEach((child: t.StaticComponentObject, i) => {
            children.push(render(child, pathsProp.concat('children', i)))
          })
        } else if (/popUpView|viewTag/.test(key)) {
          set(props, `data-viewtag`, value)
        } else if (key === 'data-value') {
          if (component['data-value']) {
            children.push(render(String(component['data-value']), pathsProp))
          } else {
            value && children.push(render(value, pathsProp))
          }
        } else if (
          key === 'data-src' ||
          (key === 'path' && /(image|video)/i.test(type))
        ) {
          if (_isListConsumer) {
            const dataObject = getListDataObject(component)
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
            props.style = {}
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
            props[key] = getListDataObject(component)
          }
        }
      }

      if (children.length) props.children = children

      if (props._path_ && u.isStr(props._path_)) {
        if (props.type === 'img') {
          // if
        }
      }

      return renderElement({ children, ...props })
    },
    [createActionChain, getR, pageCtx, setR, root],
  )

  const renderElement = React.useCallback(
    ({
      path = [],
      type,
      key,
      children = [],
      style,
      ...rest
    }: t.CreateElementProps) => {
      let _children = [] as React.ReactElement[]
      let index = 0

      for (const childProps of u.array(children)) {
        const _path = (path || []).concat('children', index)
        const renderKey = _path.join('.')

        if (u.isObj(childProps)) {
          const props = { ...childProps, path: _path }
          _children.push(
            <React.Fragment key={renderKey}>
              {renderElement(props)}
            </React.Fragment>,
          )
        } else {
          _children.push(
            <React.Fragment key={renderKey}>{childProps}</React.Fragment>,
          )
        }
        index++
      }

      return React.createElement(
        type,
        { ...rest, style, key },
        _children.length ? _children : undefined,
      )
    },
    [render],
  )

  return render
}

export default useRenderer
