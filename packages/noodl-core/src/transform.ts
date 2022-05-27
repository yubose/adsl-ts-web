/**
 * TODO - Not being used yet (copied from noodl-ui)
 */
import type { ComponentObject, VpUnit } from 'noodl-types'
import * as fp from './utils/fp'
import {
  excludeIteratorVar,
  formatColor,
  getSize,
  getPositionProps,
  getViewportBound,
  getVpKey,
  hasLetter,
  presets,
  trimReference,
} from './utils/noodl'
import coreBuiltIns from './builtIn/core'
import * as is from './utils/is'
import * as c from './constants'
import * as t from './types'

/**
 * Retrieves a value from ARoot or an object literal
 * @param root ARoot or a regular object literal
 * @param key Key
 * @returns The retrieved value
 */
function getR(root: Record<string, any> | t.ARoot, key: string[] | string) {
  if (is.root(root)) return root.get(is.arr(key) ? key.join('.') : key)
  return fp.get(root, key)
}

/**
 * Deeply resolves reference strings
 * @param ref Reference string
 * @param options Options
 * @returns The dereferenced value
 */
function getByRef(
  ref = '',
  {
    blueprint,
    context,
    props,
    root,
    rootKey,
    getParent,
  }: {
    blueprint: Partial<ComponentObject>
    context:
      | { dataObject?: any; iteratorVar?: string; listObject?: any }
      | undefined
    props: Record<string, any>
    root: Record<string, any>
    rootKey?: string
    getParent?: any
  },
) {
  // TODO - Resolving traversal references is not working expectedly
  if (is.traverseReference(ref)) {
    if (is.fnc(getParent)) {
      // ['', '', '', '.colorChange']
      let parts = ref.split('_')
      let depth = parts.filter((s) => s === '').reduce((acc) => ++acc, 0)
      let nextKey = parts.shift()

      while (nextKey && !nextKey.startsWith('.')) {
        if (nextKey === '') {
          // continue
        } else if (nextKey.startsWith('.')) {
          const parent = getParent({
            blueprint,
            context: context ?? {},
            props,
            op: 'traverse',
            opArgs: { depth, ref },
          })
          return getR(parent, nextKey[1].slice())
        }

        nextKey = parts.shift()
      }
    }
  }

  let refValue: any

  if (is.localReference(ref)) {
    if (rootKey) {
      refValue = refValue = getR(
        getR(root, rootKey),
        fp.path(trimReference(ref)),
      )
    }
  } else if (is.rootReference(ref)) {
    refValue = getR(root, trimReference(ref))
  }

  if (is.str(refValue) && is.reference(refValue)) {
    const path = fp.path(trimReference(refValue))
    if (is.localReference(refValue)) {
      const prevPath = fp.path(trimReference(ref))
      if (prevPath[0] !== rootKey) rootKey = prevPath[0]
    } else {
      if (path[0] !== rootKey) rootKey = path.shift()
    }
    return getByRef(refValue, { ...arguments[1], rootKey })
  }
  return is.und(refValue) ? ref : refValue
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
    blueprint = props as any
    props = {}
    return transform(props, blueprint, {
      ...parseOptions,
      getHelpers: (opts) => ({
        blueprint,
        context: context ?? {},
        getParent: parseOptions?.getParent,
        props,
        root: parseOptions?.root ?? {},
        rootKey: parseOptions?.pageName ?? '',
        ...opts,
      }),
    })
  }

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
      coreBuiltIns.getBaseStyles(blueprint, root),
    )) {
      props.style[key] = value
    }
  }

  if (is.obj(blueprint)) {
    fp.set(props, 'type', blueprint.type)

    let iteratorVar = context?.iteratorVar ?? ''

    for (const [originalKey, originalValue] of fp.entries(blueprint)) {
      let value = props?.[originalKey]

      if (originalKey === 'dataKey') {
        if (is.str(originalValue)) {
          let datapath = fp.path(trimReference(originalValue))
          let isLocalKey = is.localKey(datapath.join('.'))
          // Note: This is here for fallback reason
          // dataKey should never be a reference in the noodl
          if (is.reference(originalValue)) {
            isLocalKey = is.localReference(originalValue)
          }
          fp.set(
            props,
            'data-value',
            getR(isLocalKey ? getR(root, pageName) : root, datapath),
          )
          if (is.select(blueprint)) {
            fp.set(
              props,
              'data-options',
              is.str(blueprint.options)
                ? getR(isLocalKey ? getR(root, pageName) : root, datapath)
                : fp.toArr(blueprint.options),
            )
          }
          continue
        }
      } else if (originalKey === 'options') {
        if (is.select(blueprint)) {
          const dataKey = blueprint.dataKey
          const isUsingDataKey = is.str(dataKey) || is.str(originalValue)
          // Receiving their options by reference
          if (isUsingDataKey && !is.arr(originalValue)) {
            let dataPath = is.str(dataKey) ? dataKey : fp.toStr(originalValue)
            let dataObject: any
            let isListPath =
              !!iteratorVar && fp.toStr(dataPath).startsWith(iteratorVar)

            value = dataPath ? getR(dataObject, dataPath) : dataObject

            if (!is.arr(value)) {
              if (isListPath) {
                dataPath = excludeIteratorVar(dataPath, iteratorVar) ?? ''
                dataObject = context?.dataObject
              } else {
                dataPath = trimReference(dataPath)
                value = getR(
                  is.localKey(dataPath) ? getR(root, pageName) : root,
                  dataPath,
                )
              }
            }
          }

          props['data-options'] = value ?? []
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
            fp.set(value, 'display', 'flex')
            if (axis === 'horizontal') {
              fp.set(value, 'flexWrap', 'nowrap')
            } else if (axis === 'vertical') {
              fp.set(value, 'flexDirection', 'column')
            }
          }

          // ALIGN
          if (is.str(align) && /center[xy]/.test(align)) {
            markDelete('align')
            fp.set(value, 'display', 'flex')
            if (align === 'centerX') {
              fp.set(value, 'justifyContent', 'center')
            } else if (align === 'centerY') {
              fp.set(value, 'alignItems', 'center')
            }
          }

          // TEXTALIGN
          if (textAlign) {
            // "centerX", "centerY", "left", "center", "right"
            if (is.str(textAlign)) {
              if (textAlign === 'left') fp.set(value, 'textAlign', 'left')
              else if (textAlign === 'center')
                fp.set(value, 'textAlign', 'center')
              else if (textAlign === 'right')
                fp.set(value, 'textAlign', 'right')
              else if (textAlign === 'centerX') {
                fp.set(value, 'textAlign', 'center')
                fp.set(restoreVals, 'textAlign', 'center')
              } else if (textAlign === 'centerY') {
                fp.set(value, 'display', 'flex')
                fp.set(value, 'alignItems', 'center')
                markDelete('textAlign')
              }
            }
            // { x, y }
            else if (is.obj(textAlign)) {
              if (!is.nil(textAlign.x)) {
                fp.set(
                  value,
                  'textAlign',
                  textAlign.x === 'centerX' ? 'center' : textAlign.x,
                )
              }
              if (textAlign.y != undefined) {
                // The y value needs to be handled manually here since getTextAlign will
                //    return { textAlign } which is meant for x
                if (textAlign.y === 'center' ?? textAlign.y === 'centerY') {
                  let convert = new Map([
                    ['left', 'flex-start'],
                    ['right', 'flex-end'],
                    ['center', 'center'],
                  ])
                  // convert (left ,center ,right) to (flex-start | flex-end | center)
                  fp.set(value, 'display', 'flex')
                  fp.set(value, 'alignItems', 'center')
                  fp.set(
                    value,
                    'justifyContent',
                    convert.get(textAlign.x ? textAlign.x : 'left'),
                  )
                  if (!textAlign.x) markDelete('textAlign')
                }
              }
            }
          }

          // DISPLAY
          if (display === 'inline') fp.set(value, 'display', 'inline')
          else if (display === 'inline-block') {
            fp.set(value, 'display', 'inline-block')
            fp.set(value, 'verticalAlign', 'top')
          }

          if (verticalAlign) fp.set(value, 'verticalAlign', verticalAlign)

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
            if (border == '0') fp.set(value, 'borderStyle', 'none')

            if (is.obj(border)) {
              borderStyle = border.style
              color = border.color
              width = border.width
              line = border.line
            }

            if (color) fp.set(value, 'borderColor', color.replace('0x', '#'))
            if (line) fp.set(value, 'borderStyle', line)
            if (width) fp.set(value, 'borderWidth', width)

            // Analyizing border
            if (borderStyle == '1') {
              fp.assign(value, presets.border['1'])
            } else if (borderStyle == '2') {
              fp.assign(value, presets.border['2'])
            } else if (borderStyle == '3') {
              fp.assign(value, presets.border['3'])
              if (!width) fp.set(value, 'borderWidth', 'thin')
            } else if (borderStyle == '4') {
              fp.assign(value, presets.border['4'])
              if (!width) fp.set(value, 'borderWidth', 'thin')
            } else if (borderStyle == '5') {
              fp.assign(value, presets.border['5'])
            } else if (borderStyle == '6') {
              fp.assign(value, presets.border['6'])
            } else if (borderStyle == '7') {
              fp.assign(value, presets.border['7'])
            }
          }

          if (borderWidth) fp.set(value, 'borderWidth', fp.toPx(borderWidth))

          if (borderRadius) {
            if (is.noodlUnit(borderRadius)) {
              fp.set(
                value,
                'borderRadius',
                fp.toPx(getSize(borderRadius, viewport?.height)),
              )
            } else {
              if (is.str(borderRadius) || is.num(borderRadius)) {
                fp.set(value, 'borderRadius', fp.toPx(borderRadius))
              }

              // If a borderRadius effect is to be expected and there is no border
              // (since no border negates borderRadius), we need to add an invisible
              // border to simulate the effect
              const regex = /[a-zA-Z]+$/
              const radius = Number(`${borderRadius}`.replace(regex, ''))
              if (!Number.isNaN(radius)) {
                fp.set(value, 'borderRadius', `${radius}px`)
                if (
                  !(is.str(value.border) && value.border) &&
                  is.nullishStyleValue(value.borderWidth)
                ) {
                  // Make the border invisible
                  fp.set(value, 'borderWidth', `1px`)
                  fp.set(value, 'borderColor', 'rgba(0, 0, 0, 0)')
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
                  fp.set(
                    value,
                    'fontSize',
                    fp.toPx(getSize(fontSize, viewport?.height)),
                  )
                } else fp.set(value, 'fontSize', fp.toPx(fontSize))
              }
            }
            // 10 --> '10px'
            else if (is.num(fontSize))
              fp.set(value, 'fontSize', fp.toPx(fontSize))

            if (fontFamily) fp.set(value, 'fontFamily', fontFamily)
          }

          // { fontStyle } --> { fontWeight }
          if (fontStyle === 'bold') {
            fp.set(value, 'fontWeight', 'bold')
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
                  getViewportBound(viewport, posKey),
                )
                if (is.obj(result)) {
                  for (const [k, v] of fp.entries(result)) fp.set(value, k, v)
                }
              }
            })
            // Remove textAlign if it is an object (NOODL data type is not a valid DOM style attribute)
            if (is.obj(value?.textAlign)) markDelete('textAlign')
          }

          /* -------------------------------------------------------
            ---- SIZES
          -------------------------------------------------------- */

          const { width, height, maxHeight, maxWidth, minHeight, minWidth } =
            (originalValue ?? {}) as any

          // if (viewport) {
          for (const [key, val] of [
            ['width', width],
            ['height', height],
          ]) {
            if (!is.nil(val)) {
              fp.set(
                value,
                key,
                fp.toStr(getSize(val, getViewportBound(viewport, key))),
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
              fp.set(value, key, fp.toStr(getSize(val, viewport?.[vpKey])))
            }
          }
          // }
          // HANDLING ARTBITRARY STYLES
          for (let [styleKey, styleValue] of fp.entries(originalValue)) {
            // Unwrap the reference for processing
            if (is.str(styleValue) && is.reference(styleValue)) {
              const isLocal = is.localReference(styleValue)
              styleValue = getByRef(
                styleValue,
                getHelpers({ rootKey: isLocal ? pageName : undefined }),
              )
            }

            if (is.keyRelatedToWidthOrHeight(styleValue)) {
              fp.set(
                value,
                styleKey,
                fp.toStr(
                  getSize(
                    styleValue,
                    fp.toNum(getViewportBound(viewport, fp.toStr(styleKey))),
                  ),
                ),
              )
            }

            if (is.str(styleValue)) {
              while (is.reference(styleValue)) {
                const isLocal = is.localReference(styleValue)
                const newstyleValue = getByRef(
                  styleValue,
                  getHelpers({ rootKey: isLocal ? pageName : undefined }),
                )
                if (newstyleValue === styleValue) break
                // It will do an infinite loop without this
                if (is.traverseReference(styleValue)) break
                styleValue = newstyleValue
              }

              // Resolve vw/vh units (Values directly relative to viewport)
              if (is.vwVh(styleValue)) {
                if (keepVpUnit) {
                  fp.set(value, styleKey, `calc(${styleValue})`)
                } else {
                  const vpKey = getVpKey(styleValue)
                  const vpVal = viewport?.[vpKey as VpUnit]
                  const valueNum = fp.toNum(styleValue) / 100
                  if (is.nil(vpVal)) fp.set(value, styleKey, styleValue)
                  else
                    fp.set(value, styleKey, fp.toPx(getSize(valueNum, vpVal)))
                }
              }

              // Cache this value to the variable so it doesn't fp.get mutated inside this func since there are moments when value is changing before this func ends
              // If the value is a path of a list item data object
              const isListPath =
                !!iteratorVar && fp.toStr(styleValue).startsWith(iteratorVar)

              // '2.8vh', '20px', etc
              const isSizeValue =
                is.vwVh(styleValue) ||
                is.keyRelatedToWidthOrHeight(styleKey) ||
                ['fontSize', 'borderRadius', 'borderWidth'].includes(
                  fp.toStr(styleKey),
                )

              if (isSizeValue) {
                if (viewport) {
                  if (is.vwVh(styleValue)) {
                    const valueNum = fp.toNum(styleValue) / 100
                    fp.set(
                      value,
                      styleKey,
                      keepVpUnit
                        ? `calc(${styleValue})`
                        : fp.toStr(
                            getSize(
                              valueNum,
                              fp.toNum(getViewportBound(viewport, styleValue)),
                            ),
                          ),
                    )
                  } else if (is.keyRelatedToWidthOrHeight(styleKey)) {
                    const computedValue = is.noodlUnit(styleValue)
                      ? fp.toStr(
                          getSize(
                            styleValue,
                            fp.toNum(
                              getViewportBound(viewport, fp.toStr(styleKey)),
                            ),
                          ),
                        )
                      : undefined
                    if (is.noodlUnit(styleValue)) {
                      fp.set(value, styleKey, computedValue)
                    } else if (is.keyRelatedToHeight(styleKey)) {
                      if (styleKey == 'borderRadius' && is.str(styleValue)) {
                        if (styleValue.includes('px')) {
                          fp.set(value, styleKey, styleValue)
                        } else {
                          fp.set(value, styleKey, fp.toPx(styleValue))
                        }
                      }
                    }
                  }
                }
              } else {
                fp.set(value, styleKey, formatColor(styleValue))
              }

              if (styleKey == 'pointerEvents' && styleValue != 'none') {
                markDelete('pointerEvents')
              }

              if (styleKey == 'isHidden' && is.boolTrue(styleValue)) {
                fp.set(props, 'style.visibility', 'hidden')
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
                  fp.set(value, 'color', formatColor(styleValue))
                  markDelete('textColor')
                } else {
                  // Some list item consumers have data keys referencing color data values
                  // They are in the 0x0000000 form so we must convert them to be DOM compatible

                  if (isListPath) {
                    const dataObject = context?.dataObject
                    if (is.obj(dataObject)) {
                      const dataKey = excludeIteratorVar(
                        styleValue,
                        iteratorVar,
                      )

                      const _styleValue = formatColor(getR(dataObject, dataKey))

                      if (is.keyRelatedToWidthOrHeight(styleKey)) {
                        if (is.noodlUnit(_styleValue)) {
                          fp.set(
                            value,
                            styleKey,
                            fp.toStr(
                              getSize(
                                _styleValue,
                                fp.toNum(
                                  getViewportBound(
                                    viewport,
                                    fp.toStr(styleKey),
                                  ),
                                ),
                              ),
                            ),
                          )
                        }
                      } else if (styleKey === 'pointerEvents') {
                        fp.set(value, 'pointer-events', _styleValue)
                      } else {
                        fp.set(value, styleKey, _styleValue)
                      }
                    } else {
                      fp.set(value, styleKey, formatColor(fp.toStr(dataObject)))
                    }
                  }

                  if (is.str(styleValue) && styleValue.startsWith('0x')) {
                    fp.set(value, styleKey, formatColor(styleValue))
                  }
                }
              }
            }
          }
        } else if (is.str(originalValue)) {
          // Unparsed style value (reference)
        }
        delKeys.forEach((key) => delete value[key])
        fp.entries(restoreVals).forEach(([k, v]) => fp.set(value, k, v))
      } else if (originalKey === 'viewTag') {
        fp.set(
          props,
          'data-view',
          is.reference(value)
            ? getByRef(
                value,
                getHelpers({
                  rootKey: is.localReference(value) ? pageName : undefined,
                }),
              )
            : value,
        )
      } else {
        // Arbitrary references
        if (is.str(originalValue) && is.reference(originalValue)) {
          value = getByRef(originalValue, getHelpers({ rootKey: pageName }))
          fp.set(props, originalKey, value)
        }
      }
    }

    /* -------------------------------------------------------
      ---- COMPONENTS
    -------------------------------------------------------- */

    if (is.header(blueprint)) {
      fp.set(props, 'style.zIndex', 100)
    } else if (is.image(blueprint)) {
      // Remove the height to maintain the aspect ratio since images are
      // assumed to have an object-fit of 'contain'
      if (!fp.has(blueprint.style, 'height')) delete props.style.height
      // Remove the width to maintain the aspect ratio since images are
      // assumed to have an object-fit of 'contain'
      if (!fp.has(blueprint.style, 'width')) delete props.style.width
      if (!fp.has(blueprint.style, 'objectFit')) {
        fp.set(props.style, 'objectFit', 'contain')
      }
    } else if (is.listLike(blueprint) && props.style.display !== 'none') {
      const axis = blueprint.style?.axis
      fp.set(
        props,
        'style.display',
        axis === 'horizontal' ?? axis === 'vertical' ? 'flex' : 'block',
      )
      fp.set(props, 'style.listStyle', 'none')
      fp.set(props, 'style.padding', '0px')
    } else if (is.listItem(blueprint)) {
      // Flipping the position to relative to make the list items stack on top of eachother.
      //    Since the container is a type: list and already has their entire height defined in absolute values,
      //    this shouldn't have any UI issues because they'll stay contained within
      fp.set(props, 'style.listStyle', 'none')
      // props.style.padding = 0
    } else if (is.popUp(blueprint)) {
      fp.set(props, 'style.visibility', 'hidden')
    } else if (is.scrollView(blueprint) && props.style.display !== 'none') {
      fp.set(props, 'style.display', 'block')
    } else if (is.textView(blueprint)) {
      fp.set(props, 'style.rows', 10)
      fp.set(props, 'style.resize', 'none')
    } else if (is.video(blueprint)) {
      fp.set(props, 'style.objectFit', 'contain')
    }

    /* -------------------------------------------------------
      ---- OTHER / UNCATEGORIZED
    -------------------------------------------------------- */

    // Shadow
    if (is.boolTrue(blueprint?.style?.shadow)) {
      fp.set(props, 'style.boxShadow', '5px 5px 10px 3px rgba(0, 0, 0, 0.015)')
      delete props.style.shadow
    }

    // Visibility
    let isHiddenValue = blueprint?.style?.isHidden
    if (is.reference(isHiddenValue)) {
      const isLocal = is.localReference(isHiddenValue)
      isHiddenValue = getByRef(
        isHiddenValue,
        getHelpers({ rootKey: isLocal ? pageName : undefined }),
      )
    }

    is.boolTrue(isHiddenValue) && fp.set(props, 'style.visibility', 'hidden')

    if (is.bool(blueprint?.required)) {
      fp.set(props, 'required', is.boolTrue(blueprint?.required))
    }
  } else {
    /**
     * - Referenced components (ex: '.BaseHeader)
     * - Text
     */
    if (is.str(blueprint) && is.reference(blueprint)) {
      return transform(
        props,
        getByRef(
          blueprint,
          getHelpers({
            rootKey: is.localReference(blueprint) ? pageName : undefined,
          }),
        ),
      )
    } else {
      console.log({ SEE_WHAT_THIS_IS: blueprint })
    }
  }

  return props
}

export default transform
