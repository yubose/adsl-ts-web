/**
 * TODO - Not being used yet (copied from noodl-ui)
 */

import * as fp from './utils/fp'
import {
  ensureCssUnit,
  formatColor,
  getSize,
  getPositionProps,
  getViewportBound,
  getVpKey,
  hasLetter,
  presets,
  trimReference,
} from './utils/noodl'
import deref from './deref'
import coreBuiltIns from './builtIn/core'
import objectBuiltIns from './builtIn/object'
import * as is from './utils/is'
import * as c from './constants'
import * as t from './types'

const bfobjs = { core: coreBuiltIns, object: objectBuiltIns }
const bfnobjfns = { '=': { '.': { builtIn: bfobjs } } }
const bfns = bfnobjfns['=']['.'].builtIn
const bf = <P extends keyof typeof bfns>(
  key: `=.builtIn.${P}${string}`,
  ...args: any[]
) => {
  return fp.get(bfns, key.replace('=.builtIn.', ''))(...args)
}

// const bf = fp.entries(objectBuiltIns).reduce((acc, [key, fn]) => {
//   acc[`=.builtIn.${key}`] = fn
//   return acc
// }, {} as Record<`=.builtIn.${keyof typeof builtInFns}.${keyof typeof builtInFns[keyof typeof builtInFns]}`, any>)

export interface PropsObject {
  [key: string | symbol]: any
}

export interface ParseOptions<Props extends PropsObject = PropsObject> {
  /**
   * Any data needed to render/transform components
   */
  context?: t.NormalizePropsContext
  /**
   * If true, styles like fontSize will be converted to <number>vw or <number>vh if given the format
   */
  keepVpUnit?: boolean
  /**
   * A custom function called when resolving traversal references (ex: ___.viewTag).
   *
   * When resolving traversal referencies, if no function is provided then undefined will be returned
   */
  getParent?: (opts: {
    props: PropsObject
    blueprint: Partial<Props>
    context: t.NormalizePropsContext
    op?: 'traverse' | undefined
    opArgs?: Record<string, any>
  }) => any
  getHelpers?: (opts?: Record<string, any>) => {
    props: PropsObject
    getParent?: any
    blueprint: Partial<Props>
    context: t.NormalizePropsContext
    root: Record<string, any> | (() => Record<string, any>)
    rootKey: string
  }
  /**
   * Current page. If retrieving local root references, it will use this variable
   * as the local root key
   */
  pageName?: string
  /**
   * The root object or a function that returns the root object. This will
   * be used to cross-reference other page objects if needed
   */
  root?: Record<string, any> | (() => Record<string, any>)
  /**
   * A viewport containing the width/height.
   * This will be used to resolve the positioning/sizes of component styles
   */
  viewport?: t.IViewport | { width: number; height: number }
}

/**
 *
 * Normalizes + parses a component object for browsers to consume
 *   @example
 *
  ```js
    const componentObject = { style: { shadow: 'true' } }
    const normalized = { style: { boxShadow: '5px 5px 10px 3px rgba(0, 0, 0, 0.015)' } }
  ```
 */

function transform<Props extends PropsObject>(
  blueprint: Partial<Props>,
  parseOptions: ParseOptions<Props>,
): any

function transform<Props extends PropsObject>(
  props: PropsObject,
  blueprint: Partial<Props>,
  parseOptions: ParseOptions<Props>,
): any

function transform<Props extends PropsObject>(
  props: PropsObject = { style: {} },
  blueprint: Partial<Props> = {},
  parseOptions: ParseOptions<Props> = {},
) {
  if (is.und(parseOptions)) {
    parseOptions = blueprint as ParseOptions<Props>
    blueprint = props as Props
    props = {}
    return transform(props, blueprint, {
      ...parseOptions,
      getHelpers: (opts) => ({
        blueprint,
        context: context || {},
        getParent: parseOptions?.getParent,
        props,
        root: parseOptions?.root || {},
        rootKey: parseOptions?.pageName || '',
        ...opts,
      }),
    })
  }

  // if (Object.getPrototypeOf(props) !== Proxy) {
  //   props = new Proxy(props, {
  //     get(target, prop, receiver) {
  //       console.log('get', { target, prop, receiver })
  //       const originalValue = target[prop]

  //       if (prop === 'dataKey') {
  //         if (is.str(originalValue)) {
  //           let datapath = fp.toPath(trimReference(originalValue))
  //           let isLocalKey = is.localKey(datapath.join('.'))
  //           // Note: This is here for fallback reasons.
  //           // dataKey should never be a reference in the noodl
  //           if (is.reference(originalValue)) {
  //             isLocalKey = is.localReference(originalValue)
  //           }
  //           return fp.get(isLocalKey ? root[pageName] : root, datapath)
  //         }
  //       }
  //       return originalValue
  //     },
  //     set(target, prop, value) {
  //       if (prop === 'data-value') {
  //         // console.log('set', { target, value })
  //       }
  //       target[prop] = value
  //       return true
  //     },
  //   })
  // }

  // if (Object.getPrototypeOf(props.style) !== Proxy) {
  //   props.style = new Proxy(props.style, {
  //     set(target, prop, value) {
  //       console.log('style', { target, prop, value })
  //       target[prop] = value
  //       return true
  //     },
  //   })
  // }

  const {
    context,
    getParent,
    getHelpers,
    keepVpUnit,
    pageName = '',
    root = {},
    viewport,
  } = parseOptions

  if (!is.fnc(getHelpers)) {
    return transform(props, blueprint, {
      ...arguments[2],
      getHelpers: (opts) => ({
        getParent,
        props,
        blueprint,
        context,
        root,
        rootKey: pageName,
        ...opts,
      }),
    })
  }

  if (props && !props.style) props.style = {}

  if (is.obj(blueprint?.style)) {
    for (const [key, value] of fp.entries(
      bf('=.builtIn.core.getBaseStyles', blueprint, root),
    )) {
      props.style[key] = value
    }
  }

  if (is.obj(blueprint)) {
    props.type = blueprint.type

    let iteratorVar = context?.iteratorVar || ''
    // let iteratorVar = context?.iteratorVar || findIteratorVar(props) || ''

    for (const [originalKey, originalValue] of fp.entries(blueprint)) {
      let value = props?.[originalKey]

      if (originalKey === 'dataKey') {
        if (is.str(originalValue)) {
          let datapath = fp.toPath(trimReference(originalValue))
          let isLocalKey = is.localKey(datapath.join('.'))
          // Note: This is here for fallback reasons.
          // dataKey should never be a reference in the noodl
          if (is.reference(originalValue)) {
            isLocalKey = is.localReference(originalValue)
          }
          props['data-value'] = fp.get(
            isLocalKey ? root[pageName] : root,
            datapath,
          )
          if (blueprint.type === 'select') {
            props['data-options'] = is.str(blueprint.options)
              ? fp.get(isLocalKey ? root[pageName] : root, datapath)
              : fp.toArr(blueprint.options)
          }
          continue
        }
      } else if (originalKey === 'options') {
        if (blueprint.type === 'select') {
          const dataKey = blueprint.dataKey
          const isUsingDataKey = is.str(dataKey) || is.str(originalValue)
          // Receiving their options by reference
          if (isUsingDataKey && !is.arr(originalValue)) {
            let dataPath = is.str(dataKey) ? dataKey : String(originalValue)
            let dataObject: any
            let isListPath = !!iteratorVar && dataPath.startsWith(iteratorVar)

            value = dataPath ? fp.get(dataObject, dataPath) : dataObject

            if (!is.arr(value)) {
              if (isListPath) {
                dataPath = fp.excludeStr(dataPath, iteratorVar) || ''
                dataObject = context?.dataObject
                // dataObject = context?.dataObject || findListDataObject(props)
              } else {
                dataPath = trimReference(dataPath)
                value = fp.get(
                  is.localKey(dataPath) ? root[pageName] : root,
                  dataPath,
                )
              }
            }
          }
          props['data-options'] = value || []
          if (!props.options) props.options = props['data-options']
        }
      } else if (originalKey === 'style') {
        // Style keys to be removed (for the DOM) after processing
        const delKeys = [] as string[]
        const markDelete = (v: any) => !delKeys.includes(v) && delKeys.push(v)
        // Values to restore after processing to ensure that they are re-written back if overwritten
        const restoreVals = {} as Record<string, any>

        if (is.obj(originalValue)) {
          const {
            align,
            axis,
            border,
            borderRadius,
            borderWidth,
            display,
            fontFamily,
            fontSize,
            fontStyle,
            textAlign,
            verticalAlign,
          } = originalValue

          // AXIS
          if (is.str(axis) && /horizontal|vertical/.test(axis)) {
            markDelete('axis')
            value.display = 'flex'
            if (axis === 'horizontal') {
              value.flexWrap = 'nowrap'
            } else if (axis === 'vertical') {
              value.flexDirection = 'column'
            }
          }

          // ALIGN
          if (is.str(align) && /center[xy]/.test(align)) {
            markDelete('align')
            value.display = 'flex'
            if (align === 'centerX') {
              value.justifyContent = 'center'
            } else if (align === 'centerY') {
              value.alignItems = 'center'
            }
          }

          // TEXTALIGN
          if (textAlign) {
            // "centerX", "centerY", "left", "center", "right"
            if (is.str(textAlign)) {
              if (textAlign === 'left') value.textAlign = 'left'
              else if (textAlign === 'center') value.textAlign = 'center'
              else if (textAlign === 'right') value.textAlign = 'right'
              else if (textAlign === 'centerX') {
                value.textAlign = 'center'
                restoreVals.textAlign = 'center'
              } else if (textAlign === 'centerY') {
                value.display = 'flex'
                value.alignItems = 'center'
                markDelete('textAlign')
              }
            }
            // { x, y }
            else if (is.obj(textAlign)) {
              if (!is.nil(textAlign.x)) {
                value.textAlign =
                  textAlign.x === 'centerX' ? 'center' : textAlign.x
              }
              if (textAlign.y != undefined) {
                // The y value needs to be handled manually here since getTextAlign will
                //    return { textAlign } which is meant for x
                if (textAlign.y === 'center' || textAlign.y === 'centerY') {
                  let convert = new Map([
                    ['left', 'flex-start'],
                    ['right', 'flex-end'],
                    ['center', 'center'],
                  ])
                  // convert (left ,center ,right) to (flex-start | flex-end | center)
                  value.display = 'flex'
                  value.alignItems = 'center'
                  value.justifyContent = convert.get(
                    textAlign.x ? textAlign.x : 'left',
                  )
                  if (!textAlign.x) markDelete('textAlign')
                }
              }
            }
          }

          // DISPLAY
          if (display === 'inline') value.display = 'inline'
          else if (display === 'inline-block') {
            value.display = 'inline-block'
            value.verticalAlign = 'top'
          }

          if (verticalAlign) {
            value.verticalAlign = verticalAlign
          }

          /* -------------------------------------------------------
            ---- BORDERS
          -------------------------------------------------------- */

          /**
           * Returns border attributes according to the "border" property defined in the NOODL as well
           * as some native border attributes like "borderRadius"
           *    1) no border / no borderRadius/
           *    2) borderBottom / solid / no borderRadius/
           *    3) borderAll / solid / has borderRadius
           *    4) borderAll / dashed / no borderRadius
           *    5) no border / has borderRadius
           */

          if (border !== undefined) {
            let borderStyle: any
            let color: any
            let width: any
            let line: any

            // if (border == '0') debugger
            if (border == ('0' as any)) value.borderStyle = 'none'

            if (is.obj(border)) {
              borderStyle = border.style
              color = border.color
              width = border.width
              line = border.line
            }

            if (color) value.borderColor = String(color).replace('0x', '#')
            if (line) value.borderStyle = line
            if (width) value.borderWidth = width

            // Analyizing border
            if (borderStyle == '1') {
              Object.assign(value, presets.border['1'])
            } else if (borderStyle == '2') {
              Object.assign(value, presets.border['2'])
            } else if (borderStyle == '3') {
              Object.assign(value, presets.border['3'])
              if (!width) value.borderWidth = 'thin'
            } else if (borderStyle == '4') {
              Object.assign(value, presets.border['4'])
              if (!width) value.borderWidth = 'thin'
            } else if (borderStyle == '5') {
              Object.assign(value, presets.border['5'])
            } else if (borderStyle == '6') {
              Object.assign(value, presets.border['6'])
            } else if (borderStyle == '7') {
              Object.assign(value, presets.border['7'])
            }
          }

          if (borderWidth) {
            if (is.str(borderWidth)) {
              if (!hasLetter(borderWidth)) {
                value.borderWidth = `${borderWidth}px`
              }
            } else if (is.num(borderWidth)) {
              value.borderWidth = `${borderWidth}px`
            }
          }

          if (borderRadius) {
            if (is.noodlUnit(borderRadius)) {
              value.borderRadius = String(
                getSize(borderRadius, viewport?.height as number),
              )
            } else {
              if (is.str(borderRadius)) {
                value.borderRadius = !hasLetter(borderRadius)
                  ? `${borderRadius}px`
                  : `${borderRadius}`
              } else if (is.num(borderRadius)) {
                value.borderRadius = `${borderRadius}px`
              }

              // If a borderRadius effect is to be expected and there is no border
              // (since no border negates borderRadius), we need to add an invisible
              // border to simulate the effect
              const regex = /[a-zA-Z]+$/
              const radius = Number(`${borderRadius}`.replace(regex, ''))
              if (!Number.isNaN(radius)) {
                value.borderRadius = `${radius}px`
                if (
                  !value.borderWidth ||
                  value.borderWidth === 'none' ||
                  value.borderWidth === '0px'
                ) {
                  // Make the border invisible
                  value.borderWidth = '1px'
                  value.borderColor = 'rgba(0, 0, 0, 0)'
                }
              }
            }
          }

          if (border?.style) markDelete('border')

          /* -------------------------------------------------------
            ---- FONTS
          -------------------------------------------------------- */

          if (!is.und(fontSize)) {
            // '10' --> '10px'
            if (is.str(fontSize)) {
              if (!hasLetter(fontSize)) {
                if (is.noodlUnit(fontSize)) {
                  value.fontSize = String(
                    getSize(fontSize, viewport?.height as number),
                  )
                } else value.fontSize = `${fontSize}px`
              }
            }
            // 10 --> '10px'
            else if (is.num(fontSize)) value.fontSize = `${fontSize}px`
            is.str(fontFamily) && value.fontFamily
          }

          // { fontStyle } --> { fontWeight }
          if (fontStyle === 'bold') {
            value.fontWeight = 'bold'
            markDelete('fontStyle')
          }

          /* -------------------------------------------------------
            ---- POSITION
          -------------------------------------------------------- */

          {
            c.posKeys.forEach((posKey) => {
              if (!is.nil(originalValue?.[posKey])) {
                const result = getPositionProps(
                  originalValue,
                  posKey,
                  getViewportBound(viewport, posKey) as number,
                )
                if (is.obj(result)) {
                  for (const [k, v] of fp.entries(result)) value[k] = v
                }
              }
            })
            // Remove textAlign if it is an object (NOODL data type is not a valid DOM style attribute)
            if (is.obj(value?.['textAlign'])) markDelete('textAlign')
          }

          /* -------------------------------------------------------
            ---- SIZES
          -------------------------------------------------------- */

          const { width, height, maxHeight, maxWidth, minHeight, minWidth } =
            originalValue || {}

          // if (viewport) {
          for (const [key, val] of [
            ['width', width],
            ['height', height],
          ]) {
            if (!is.nil(val)) {
              value[key] = String(
                getSize(val, getViewportBound(viewport, key) as number, {
                  toFixed: 2,
                  unit: 'px',
                }),
              )
            }
          }
          for (const [key, vpKey, val] of [
            ['maxHeight', 'height', maxHeight],
            ['minHeight', 'height', minHeight],
            ['maxWidth', 'width', maxWidth],
            ['minWidth', 'width', minWidth],
          ]) {
            if (!is.nil(val)) {
              value[key] = String(getSize(val, viewport?.[vpKey]))
            }
          }

          // }
          // HANDLING ARTBITRARY STYLES
          for (let [styleKey, styleValue] of fp.entries(originalValue)) {
            // Unwrap the reference for processing
            if (is.str(styleValue) && is.reference(styleValue)) {
              const isLocal = is.localReference(styleValue)
              styleValue = deref({
                ref: styleValue,
                ...getHelpers({ rootKey: isLocal ? pageName : undefined }),
              })
            }

            if (is.keyRelatedToWidthOrHeight(styleValue)) {
              value[styleKey] = String(
                getSize(
                  styleValue,
                  getViewportBound(viewport, styleKey) as number,
                  { unit: 'px' },
                ),
              )
            }

            if (is.str(styleValue)) {
              while (is.reference(styleValue)) {
                const isLocal = is.localReference(styleValue)
                const newstyleValue = deref({
                  ref: styleValue,
                  ...getHelpers({ rootKey: isLocal ? pageName : undefined }),
                })
                if (newstyleValue === styleValue) break
                // It will do an infinite loop without this
                if (is.traverseReference(styleValue)) break
                styleValue = newstyleValue
              }

              // Resolve vw/vh units (Values directly relative to viewport)
              if (is.vwVh(styleValue)) {
                if (keepVpUnit) {
                  value[styleKey] = `calc(${styleValue})`
                } else {
                  const vpKey = getVpKey(styleValue)
                  const vpVal = viewport?.[vpKey]
                  const valueNum = fp.toNum(styleValue) / 100

                  if (is.nil(vpVal)) {
                    value[styleKey] = styleValue
                  } else {
                    value[styleKey] = String(getSize(valueNum, vpVal as number))
                  }
                }
              }

              // Cache this value to the variable so it doesn't get mutated inside this func since there are moments when value is changing before this func ends
              // If the value is a path of a list item data object
              const isListPath =
                !!iteratorVar && String(styleValue).startsWith(iteratorVar)

              // '2.8vh', '20px', etc
              const isSizeValue =
                is.vwVh(styleValue) ||
                is.keyRelatedToWidthOrHeight(styleKey) ||
                ['fontSize', 'borderRadius', 'borderWidth'].includes(styleKey)

              if (isSizeValue) {
                if (viewport) {
                  if (is.vwVh(styleValue)) {
                    const valueNum = fp.toNum(styleValue) / 100
                    value[styleKey] = keepVpUnit
                      ? `calc(${styleValue})`
                      : ensureCssUnit(
                          getSize(
                            valueNum,
                            // TODO - Why is width hard coded?
                            getViewportBound(viewport, styleValue) as number,
                            { toFixed: 2 },
                          ),
                        )
                  } else if (is.keyRelatedToWidthOrHeight(styleKey)) {
                    const computedValue = is.noodlUnit(styleValue)
                      ? String(
                          getSize(
                            styleValue,
                            getViewportBound(viewport, styleKey) as number,
                            { unit: 'px' },
                          ),
                        )
                      : undefined
                    if (is.noodlUnit(styleValue)) {
                      value[styleKey] = computedValue
                    } else if (is.keyRelatedToHeight(styleKey)) {
                      if (styleKey == 'borderRadius' && is.str(styleValue)) {
                        if (styleValue.includes('px')) {
                          value[styleKey] = `${styleValue}`
                        } else {
                          value[styleKey] = `${styleValue}px`
                        }
                      }
                    }
                  }
                }
              } else {
                value[styleKey] = formatColor(styleValue)
              }

              if (styleKey == 'pointerEvents' && styleValue != 'none') {
                markDelete('pointerEvents')
              }

              if (styleKey == 'isHidden' && is.boolTrue(styleValue)) {
                props.style.visibility = 'hidden'
              }

              // TODO - Find out how to resolve the issue of "value" being undefined without this string check when we already checked above this
              if (
                is.str(styleValue) &&
                (styleKey === 'textColor' ||
                  styleValue.startsWith('0x') ||
                  isListPath)
              ) {
                /* -------------------------------------------------------
                    ---- COLORS - REMINDER: Convert color values like 0x00000000 to #00000000
                  -------------------------------------------------------- */
                if (styleKey === 'textColor') {
                  value.color = formatColor(styleValue)
                  markDelete('textColor')
                } else {
                  // Some list item consumers have data keys referencing color data values
                  // They are in the 0x0000000 form so we must convert them to be DOM compatible

                  if (isListPath) {
                    const dataObject = context?.dataObject
                    // context?.dataObject || findListDataObject(props)
                    if (is.obj(dataObject)) {
                      const dataKey = fp.excludeStr(
                        styleValue,
                        iteratorVar,
                      ) as string

                      const _styleValue = formatColor(
                        fp.get(dataObject, dataKey),
                      )

                      if (is.keyRelatedToWidthOrHeight(styleKey)) {
                        if (is.noodlUnit(_styleValue)) {
                          value[styleKey] = String(
                            getSize(
                              _styleValue,
                              getViewportBound(viewport, styleKey) as number,
                              { unit: 'px' },
                            ),
                          )
                        }
                      } else {
                        value[styleKey] = _styleValue
                      }
                    } else {
                      value[styleKey] = formatColor(String(dataObject))
                    }
                  }

                  if (is.str(styleValue) && styleValue.startsWith('0x')) {
                    value[styleKey] = formatColor(styleValue)
                  }
                }
              }
            }
          }
        } else if (is.str(originalValue)) {
          // Unparsed style value (reference)
        }
        delKeys.forEach((key) => delete value[key])
        fp.entries(restoreVals).forEach(([k, v]) => (value[k] = v))
      } else if (originalKey === 'viewTag') {
        props['data-viewtag'] = is.reference(value)
          ? deref({
              ref: value,
              ...getHelpers({
                rootKey: is.localReference(value) ? pageName : undefined,
              }),
            })
          : value
      } else {
        // Arbitrary references
        if (is.str(originalValue) && is.reference(originalValue)) {
          value = deref({
            ref: originalValue,
            ...getHelpers({ rootKey: pageName }),
          })
          props[originalKey] = value
        }
      }
    }

    /* -------------------------------------------------------
      ---- COMPONENTS
    -------------------------------------------------------- */

    if (blueprint.type === 'header') {
      props.style.zIndex = 100
    } else if (blueprint.type === 'image') {
      // Remove the height to maintain the aspect ratio since images are
      // assumed to have an object-fit of 'contain'
      if (!('height' in ((blueprint.style as any) || {}))) {
        delete props.style.height
      }
      // Remove the width to maintain the aspect ratio since images are
      // assumed to have an object-fit of 'contain'
      if (!('width' in ((blueprint.style as any) || {}))) {
        delete props.style.width
      }
      if (!('objectFit' in ((blueprint.style as any) || {}))) {
        props.style.objectFit = 'contain'
      }
    } else if (
      (blueprint.type === 'list' || blueprint.type === 'chatList') &&
      props.style.display !== 'none'
    ) {
      const axis = blueprint.style?.axis
      props.style.display =
        axis === 'horizontal' || axis === 'vertical' ? 'flex' : 'block'
      props.style.listStyle = 'none'
      props.style.padding = '0px'
    } else if (blueprint.type === 'listItem') {
      // Flipping the position to relative to make the list items stack on top of eachother.
      //    Since the container is a type: list and already has their entire height defined in absolute values,
      //    this shouldn't have any UI issues because they'll stay contained within
      props.style.listStyle = 'none'
      // props.style.padding = 0
    } else if (blueprint.type === 'popUp') {
      props.style.visibility = 'hidden'
    } else if (
      blueprint.type === 'scrollView' &&
      props.style.display !== 'none'
    ) {
      props.style.display = 'block'
    } else if (blueprint.type === 'textView') {
      props.style.rows = 10
      props.style.resize = 'none'
    } else if (blueprint.type === 'video') {
      props.style.objectFit = 'contain'
    }

    /* -------------------------------------------------------
      ---- OTHER / UNCATEGORIZED
    -------------------------------------------------------- */

    // Shadow
    if (is.boolTrue(blueprint?.style?.shadow)) {
      props.style.boxShadow = '5px 5px 10px 3px rgba(0, 0, 0, 0.015)'
      delete props.style.shadow
    }

    // Visibility
    let isHiddenValue = blueprint?.style?.isHidden
    if (is.reference(isHiddenValue)) {
      const isLocal = is.localReference(isHiddenValue)
      isHiddenValue = deref({
        ref: isHiddenValue,
        ...getHelpers({ rootKey: isLocal ? pageName : undefined }),
      })
    }
    is.boolTrue(isHiddenValue) && (props.style.visibility = 'hidden')

    if (is.bool(blueprint?.required)) {
      props.required = is.boolTrue(blueprint?.required)
    }
  } else {
    /**
     * - Referenced components (ex: '.BaseHeader)
     * - Text
     */
    if (is.str(blueprint) && is.reference(blueprint)) {
      return transform(
        props,
        deref({
          ref: blueprint,
          ...getHelpers({
            rootKey: is.localReference(blueprint) ? pageName : undefined,
          }),
        }),
      )
    } else {
      console.log({ SEE_WHAT_THIS_IS: blueprint })
    }
  }

  return props
}

export function createTransformer() {
  let transformers = []

  function _use(value: unknown) {
    if (is.arr(value)) {
    }
  }

  return {
    use: _use,
  }
}

export default transform
