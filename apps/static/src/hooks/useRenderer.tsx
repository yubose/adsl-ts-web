import React from 'react'
import produce from 'immer'
import * as nt from 'noodl-types'
import { deref, triggers, resolveAssetUrl } from 'noodl-ui'
import type { NUITrigger } from 'noodl-ui'
import { excludeIteratorVar, trimReference } from 'noodl-utils'
import get from 'lodash/get'
import * as u from '@jsmanifest/utils'
import useActionChain from '@/hooks/useActionChain'
import useBuiltInFns from '@/hooks/useBuiltInFns'
import getTagName from '@/utils/getTagName'
import log from '@/utils/log'
import is from '@/utils/is'
import useCtx from '@/useCtx'
import trimVarReference from '@/utils/trimVarReference'
// import deref from '@/utils/deref'
import { getCurrent } from '@/utils/immer'
import { usePageCtx } from '@/components/PageContext'
import type * as t from '@/types'
import { handleIfObject } from '@/utils/actionUtils'

interface CreateElementProps<Props = any> {
  key?: string
  type: string
  children?: (CreateElementProps<Props> | number | string)[] | number | string
  style?: React.CSSProperties
  [key: string]: any
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

function useRenderer() {
  // Used to prevent infinite loops when dereferencing references
  const refsRef = React.useRef<Record<string, any>>({})
  const { getR, root, setR } = useCtx()
  const { createActionChain, execute, executeIf } = useActionChain()
  const builtInFns = useBuiltInFns()
  const {
    assetsUrl,
    getDataObject,
    getListObject,
    getIteratorVar,
    isListConsumer,
    name,
  } = usePageCtx()

  const render = React.useCallback(
    (
      component: t.StaticComponentObject | string,
      componentPath: t.ComponentPath,
    ) => {
      if (u.isStr(component)) {
        if (is.reference(component)) {
          if (refsRef.current !== component) {
            refsRef.current = component
            return render(
              deref({ ref: component, rootKey: name, root }),
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
      let children = [] as CreateElementProps<any>[]
      let iteratorVar = getIteratorVar?.(component)
      let elementType = getTagName(type) || 'div'

      id = id || dataKey

      let props = {
        type: elementType,
        key: id,
      } as CreateElementProps<any>

      for (let [key, value] of u.entries(component)) {
        if (key.startsWith('data-')) props[key] = value

        if (u.isStr(value)) {
          if (is.reference(value)) {
            if (key === 'dataKey') {
              value = trimReference(value)
            } else {
              props[key] = deref({ ref: value, root, rootKey: name })
              value = props[key]
            }
          }
        }

        if (key === 'children') {
          if (component.type === 'list') {
            let listObject = getListObject(id, root, name)
            let numDataObjects = 0

            if (u.isStr(listObject) && nt.Identify.reference(listObject)) {
              let datapath = trimReference(listObject)

              if (nt.Identify.localReference(listObject)) {
                listObject = get(root[name], datapath)
              } else {
                listObject = get(root, `${name}.${datapath}`)
              }
            }

            if (u.isArr(listObject)) {
              numDataObjects = listObject.length
            }

            for (let index = 0; index < numDataObjects; index++) {
              const child = value[index]
              children.push(
                render(child, componentPath.concat('children', index)),
              )

              if (index + 1 > numDataObjects) {
                break
              }
            }
          } else {
            u.array(value).forEach((child: t.StaticComponentObject, index) =>
              children.push(
                render(child, componentPath.concat('children', index)),
              ),
            )
          }
        } else if (/popUpView\/viewTag/.test(key)) {
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
            const dataObject = deref({
              ref: getDataObject(component.id, root, name),
              root,
              rootKey: name,
              iteratorVar,
            })

            if (
              u.isStr(component.path) &&
              component.path.startsWith(iteratorVar)
            ) {
              props.src = get(
                dataObject,
                excludeIteratorVar(component.path, iteratorVar),
              )
              if (
                props.src &&
                u.isStr(props.src) &&
                !props.src.startsWith('http')
              ) {
                props.src = assetsUrl + props.src
              }
            } else if (is.folds.emit(component.path)) {
              props.src = builtInFns.builtIns['=.builtIn.object.resolveEmit']({
                dataIn: { emit: component.path.emit, trigger: 'path' },
                dataObject,
                iteratorVar,
                root,
                rootKey: name,
              })
            } else {
              props.src = value
            }

            if (is.varReference(props.src)) {
              const refValue = get(dataObject, trimVarReference(props.src))
              props.src =
                u.isStr(refValue) && refValue.startsWith('http')
                  ? refValue
                  : `${assetsUrl}${refValue}`
            }

            props['data-src'] = props.src
          } else {
            if (is.folds.emit(component.path)) {
              const emitObject = component.path
              Promise.resolve().then(async () => {
                const results = [] as any[]

                for (const action of u.array(emitObject.emit.actions)) {
                  if (is.folds.if(action)) {
                    const ifResult = await handleIfObject(action, {
                      use: {
                        ref: (ref) => getR(root, trimReference(ref), name),
                      },
                    })
                    if (u.isStr(ifResult)) {
                      const src = `${assetsUrl}${ifResult}`
                      results.push(src)
                    }
                  }
                }

                if (results.length) {
                  if (results.length === 1) {
                    props.src = results[0]
                    if (typeof window !== 'undefined') {
                      const el = document.getElementById(
                        component.id,
                      ) as HTMLImageElement
                      if (el) el.src = props.src
                    }
                  } else {
                    log.error(
                      `REMINDER: IMPLEMENT MORE INTO THIS EMIT PATH RENDERING`,
                    )
                  }
                }
              })
            } else {
              props.src = value
            }
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
            children.push(is.reference(value) ? getR(value, name) : value)
        } else if (triggers.includes(key as string)) {
          if (nt.userEvent.includes(key as typeof nt.userEvent[number])) {
            const obj = value as t.StaticComponentObject[NUITrigger]
            const actions = obj?.actions || []
            const trigger = key as NUITrigger
            const actionChain = createActionChain?.(component, trigger, actions)

            props[trigger] = async function onExecuteActionChain(
              evt: React.SyntheticEvent<HTMLElement>,
            ) {
              let results: any[]
              let nextRoot = await produce(root, async (draft) => {
                try {
                  actionChain?.data.set('rootDraft', draft)
                  results = await actionChain?.execute(evt)
                } catch (error) {
                  log.error(
                    error instanceof Error ? error : new Error(String(error)),
                  )
                }
              })
              actionChain?.data.delete('rootDraft')
              setR(getCurrent(nextRoot))
              return results
            }
          }
        } else {
          if (!keysToStripRegex.test(key as string)) props[key] = value
        }

        if (u.isStr(value)) {
          if (is.reference(value)) {
            props[key] = deref({ ref: value, root, rootKey: name })
          } else if (
            key !== 'data-key' &&
            iteratorVar &&
            value.startsWith(iteratorVar) &&
            key !== '_path_' &&
            key !== 'iteratorVar'
          ) {
            props[key] = value
          }
        }
      }

      if (children.length) props.children = children

      if (props._path_) {
        if (u.isStr(props._path_) && iteratorVar) {
          if (props.type === 'img') {
            const dataObject = getDataObject(props.id, root, name)
            if (!dataObject) {
              // debugger
            } else {
              const datapath = excludeIteratorVar(props._path_, iteratorVar)
              const src = get(dataObject, datapath)
              if (src) props.src = resolveAssetUrl(src, assetsUrl)
            }
          }
        } else if (u.isObj(props._path_)) {
          if (is.folds.emit(props._path_)) {
            const dataObject = getDataObject(component.id, root, name)
            const emitObject = deref({
              dataObject,
              iteratorVar,
              ref: props._path_,
              root,
              rootKey: name,
            })

            let result = builtInFns.builtIns['=.builtIn.object.resolveEmit']({
              dataIn: { ...emitObject, trigger: 'path' },
              dataObject,
              root,
              rootKey: name,
            })

            if (u.isStr(result) && result.startsWith('$')) {
              result = result.replace('$var.', '')
              result = get(dataObject, result, '')
            }

            if (result != undefined) {
              props.src = resolveAssetUrl(result, assetsUrl)
            }
          }
        }
      }

      if (props['data-src']) {
        props.src = props['data-src']
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
    }: CreateElementProps) => {
      let _children = [] as React.ReactElement[]
      let _index = 0

      u.array(children).forEach((cprops) => {
        const _path = (componentPath || []).concat('children', _index)
        const renderKey = _path.join('.')

        if (u.isObj(cprops)) {
          const props = { ...cprops, componentPath: _path }
          _children.push(
            <React.Fragment key={renderKey}>
              {React.isValidElement(props) ? props : renderElement(props)}
            </React.Fragment>,
          )
        } else {
          if (u.isStr(cprops) && cprops.includes('&nbsp;')) {
            cprops = React.createElement('span', {
              dangerouslySetInnerHTML: { __html: cprops },
            }) as any
          }
          _children.push(
            <React.Fragment key={renderKey}>{cprops as any}</React.Fragment>,
          )
        }
        _index++
      })

      return React.createElement(
        type,
        rest,
        /img|input|textarea/.test(type)
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
