import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import * as nu from 'noodl-utils'
import get from 'lodash/get'
import nui from './noodl-ui'
import NuiViewport from './Viewport'
import { presets } from './constants'
import { findIteratorVar, findListDataObject } from './utils/noodl'
import * as com from './utils/common'
import * as util from './utils/style'

function getByRef(root = {}, ref = '', rootKey = '') {
  if (nt.Identify.localReference(ref)) {
    if (rootKey) return get(root[rootKey], nu.toDataPath(nu.trimReference(ref)))
  } else if (nt.Identify.rootReference(ref)) {
    return get(root, nu.toDataPath(nu.trimReference(ref)))
  }
  return ref
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

function normalizeProps<
  Props extends Record<string, any> = Record<string, any>,
>(
  props: Record<string, any> = {},
  blueprint: Partial<Props> = {},
  {
    context,
    getBaseStyles,
    pageName = '',
    root = {},
    viewport,
  }: {
    /**
     * Any data needed to render/parse components
     */
    context?: {
      dataObject?: Record<string, any>
      iteratorVar?: string
      index?: number
      listObject?: string | any[]
    } & Record<string, any>
    /**
     * A function that will be used to merge base styles prior to parsing
     */
    getBaseStyles?: typeof nui.getBaseStyles
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
    viewport?: NuiViewport
  } = {},
) {
  if (u.isFnc(getBaseStyles) && u.isObj(blueprint?.style)) {
    for (const [key, value] of u.entries(getBaseStyles(props, blueprint))) {
      props.style[key] = value
    }
  }

  if (u.isObj(blueprint)) {
    let iteratorVar = context?.iteratorVar || findIteratorVar(props) || ''

    for (const [originalKey, originalValue] of u.entries(blueprint)) {
      let value = props?.[originalKey]

      if (originalKey === 'dataKey') {
        if (u.isStr(originalValue) && nt.Identify.reference(originalValue)) {
          if (nt.Identify.component.select(blueprint)) {
            props['data-value'] = getByRef(root, originalValue, pageName)
          }
        }
      } else if (originalKey === 'options') {
        if (nt.Identify.component.select(blueprint)) {
          const { dataKey } = blueprint
          const isUsingDataKey = !!(
            (dataKey && u.isStr(dataKey)) ||
            u.isStr(value)
          )
          // Receiving their options by reference
          if (isUsingDataKey) {
            let dataPath = dataKey && u.isStr(dataKey) ? dataKey : value
            let dataObject: any
            let isListPath = !!(iteratorVar && dataPath.startsWith(iteratorVar))

            if (!u.isArr(value)) {
              if (isListPath) {
                dataPath = nu.excludeIteratorVar(dataPath, iteratorVar)
                dataObject = context?.dataObject || findListDataObject(props)
                value = dataPath ? get(dataObject, dataPath) : dataObject
              } else {
                dataPath = nu.trimReference(dataPath)
                value = getByRef(root, dataPath, pageName)
              }
            }

            value && (props['data-options'] = value || [])
          }
        }
      } else if (originalKey === 'style') {
        if (u.isObj(originalValue)) {
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
          } = originalValue

          // AXIS
          if (axis === 'horizontal') {
            value.display = 'flex'
            value.flexWrap = 'nowrap'
            delete value.axis
          } else if (axis === 'vertical') {
            value.display = 'flex'
            value.flexDirection = 'column'
            delete value.axis
          }

          // ALIGN
          if (align) {
            if (align === 'centerX') {
              value.display = 'flex'
              value.justifyContent = 'center'
              delete value.align
            } else if (align === 'centerY') {
              value.display = 'flex'
              value.alignItems = 'center'
              delete value.align
            }
          }

          // TEXTALIGN
          if (textAlign) {
            // "centerX", "centerY", "left", "center", "right"
            if (u.isStr(textAlign)) {
              if (textAlign === 'left') value.textAlign = 'left'
              else if (textAlign === 'center') value.textAlign = 'center'
              else if (textAlign === 'right') value.textAlign = 'right'
              else if (textAlign === 'centerX') value.textAlign = 'center'
              else if (textAlign === 'centerY') {
                value.display = 'flex'
                value.alignItems = 'center'
                delete value.textAlign
              }
            }
            // { x, y }
            else if (u.isObj(textAlign)) {
              if (textAlign.x != undefined) {
                value.textAlign =
                  textAlign.x === 'centerX' ? 'center' : textAlign.x
              }
              if (textAlign.y != undefined) {
                // The y value needs to be handled manually here since util.getTextAlign will
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
                  if (!textAlign.x) delete value.textAlign
                }
              }
            }
          }

          // DISPLAY
          if (display === 'inline') value.display = 'inline'
          else if(display === 'inline-block'){
            value.display = 'inline-block'
            value.verticalAlign = "top"
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

            if (u.isObj(border)) {
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
              u.assign(value, presets.border['1'])
            } else if (borderStyle == '2') {
              u.assign(value, presets.border['2'])
            } else if (borderStyle == '3') {
              u.assign(value, presets.border['3'])
              if (!width) value.borderWidth = 'thin'
            } else if (borderStyle == '4') {
              u.assign(value, presets.border['4'])
              if (!width) value.borderWidth = 'thin'
            } else if (borderStyle == '5') {
              u.assign(value, presets.border['5'])
            } else if (borderStyle == '6') {
              u.assign(value, presets.border['6'])
            } else if (borderStyle == '7') {
              u.assign(value, presets.border['7'])
            }
          }

          if (borderWidth) {
            if (u.isStr(borderWidth)) {
              if (!com.hasLetter(borderWidth)) {
                value.borderWidth = `${borderWidth}px`
              }
            } else if (u.isNum(borderWidth)) {
              value.borderWidth = `${borderWidth}px`
            }
          }

          if (borderRadius) {
            if (util.isNoodlUnit(borderRadius)) {
              value.borderRadius = String(
                util.getSize(borderRadius, viewport?.height as number),
              )
            } else {
              if (u.isStr(borderRadius)) {
                if (!com.hasLetter(borderRadius)) {
                  value.borderRadius = borderRadius + 'px'
                } else {
                  value.borderRadius = `${borderRadius}`
                }
              } else if (u.isNum(borderRadius)) {
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

          border?.style && delete value.border

          /* -------------------------------------------------------
            ---- FONTS
          -------------------------------------------------------- */

          if (!u.isUnd(fontSize)) {
            // '10' --> '10px'
            if (u.isStr(fontSize)) {
              if (!com.hasLetter(fontSize)) {
                if (util.isNoodlUnit(fontSize)) {
                  value.fontSize = String(
                    NuiViewport.getSize(fontSize, viewport?.height as number),
                  )
                } else {
                  value.fontSize = `${fontSize}px`
                }
              }
            }
            // 10 --> '10px'
            else if (u.isNum(fontSize)) value.fontSize = `${fontSize}px`
            u.isStr(fontFamily) && value.fontFamily
          }

          // { fontStyle } --> { fontWeight }
          if (fontStyle === 'bold') {
            value.fontWeight = 'bold'
            delete value.fontStyle
          }

          /* -------------------------------------------------------
            ---- POSITION
          -------------------------------------------------------- */

          {
            util.posKeys.forEach((posKey) => {
              if (!u.isNil(originalValue?.[posKey])) {
                const result = util.getPositionProps(
                  originalValue,
                  posKey,
                  viewport?.[
                    util.xKeys.includes(posKey as any) ? 'width' : 'height'
                  ] as number,
                )
                if (u.isObj(result)) {
                  for (const [k, v] of u.entries(result)) {
                    value[k] = v
                  }
                }
              }
            })
            // Remove textAlign if it is an object (NOODL data type is not a valid DOM style attribute)
            u.isObj(value?.textAlign) && delete value.textAlign
          }

          /* -------------------------------------------------------
            ---- SIZES
          -------------------------------------------------------- */

          const { width, height, maxHeight, maxWidth, minHeight, minWidth } =
            originalValue || {}

          if (viewport) {
            if (!u.isNil(width)) {
              value.width = String(util.getSize(width as any, viewport.width))
            }

            if (!u.isNil(height)) {
              // When the value needs to change whenever the viewport height changes
              if (util.isNoodlUnit(height)) {
                value.height = String(util.getSize(height, viewport.height))
              } else {
                if (height == 1 || height == '1') {
                  value.height = String(util.getSize(height, viewport.height))
                } else {
                  value.height = String(
                    util.getSize(height as any, viewport.height),
                  )
                }
              }
            }

            //maxHeight,maxWidth,miniHeight,miniWidth
            if (!u.isNil(maxHeight)) {
              value.maxHeight = String(
                util.getSize(maxHeight as any, viewport.height),
              )
            }
            if (!u.isNil(maxWidth)) {
              value.maxWidth = String(
                util.getSize(maxWidth as any, viewport.width),
              )
            }
            if (!u.isNil(minHeight)) {
              value.minHeight = String(
                util.getSize(minHeight as any, viewport.height),
              )
            }
            if (!u.isNil(minWidth)) {
              value.minWidth = String(
                util.getSize(minWidth as any, viewport.width),
              )
            }
          }

          // HANDLING ARTBITRARY STYLES
          for (let [styleKey, styleValue] of u.entries(originalValue)) {
            if (util.vpHeightKeys.includes(styleKey as any)) {
              if (util.isNoodlUnit(styleValue)) {
                value[styleKey] = String(
                  NuiViewport.getSize(styleValue, viewport?.height as number, {
                    unit: 'px',
                  }),
                )
              }
            } else if (util.vpWidthKeys.includes(styleKey as any)) {
              if (util.isNoodlUnit(styleValue)) {
                value[styleKey] = String(
                  NuiViewport.getSize(styleValue, viewport?.width as number, {
                    unit: 'px',
                  }),
                )
              }
            }

            if (u.isStr(styleValue)) {
              // Resolve vm and vh units
              if (styleValue.endsWith('vw') || styleValue.endsWith('vh')) {
                const valueNum =
                  parseFloat(styleValue.substring(0, styleValue.length - 2)) /
                  100

                value[styleKey] = String(
                  util.getSize(
                    valueNum,
                    viewport?.[
                      styleValue.endsWith('vw') ? 'width' : 'height'
                    ] as number,
                  ),
                )
              }

              // Cache this value to the variable so it doesn't get mutated inside this func since there are moments when value is changing before this func ends
              // If the value is a path of a list item data object
              const isListPath =
                iteratorVar && styleValue.startsWith(iteratorVar)

              if (nt.Identify.reference(styleValue)) {
                // Local
                if (
                  u.isStr(styleValue) &&
                  nt.Identify.localReference(styleValue)
                ) {
                  styleValue = getByRef(root, styleValue, pageName)
                }
                // Root
                else if (u.isStr(styleValue)) {
                  if (nt.Identify.rootReference(styleValue)) {
                    styleValue = getByRef(root, styleValue)
                  }
                  if (
                    u.isStr(styleValue) &&
                    (styleValue.endsWith('vw') || styleValue.endsWith('vh'))
                  ) {
                    const valueNum =
                      parseFloat(
                        styleValue.substring(0, styleValue.length - 2),
                      ) / 100

                    value[styleKey] = String(
                      util.getSize(
                        valueNum,
                        viewport?.[
                          styleValue.endsWith('vw') ? 'width' : 'height'
                        ] as number,
                      ),
                    )
                  }
                }

                if (util.vpHeightKeys.includes(styleKey as any)) {
                  if (util.isNoodlUnit(styleValue)) {
                    value[styleKey] = String(
                      NuiViewport.getSize(
                        styleValue,
                        viewport?.height as number,
                        { unit: 'px' },
                      ),
                    )
                  }
                } else if (util.vpWidthKeys.includes(styleKey as any)) {
                  if (util.isNoodlUnit(styleValue)) {
                    value[styleKey] = String(
                      NuiViewport.getSize(
                        styleValue,
                        viewport?.width as number,
                        { unit: 'px' },
                      ),
                    )
                  }
                } else {
                  value[styleKey] = com.formatColor(styleValue)
                }
              }

              // TODO - Find out how to resolve the issue of "value" being undefined without this string check when we already checked above this
              if (
                u.isStr(styleValue) &&
                (styleKey === 'textColor' ||
                  styleValue.startsWith('0x') ||
                  isListPath)
              ) {
                /* -------------------------------------------------------
                    ---- COLORS - REMINDER: Convert color values like 0x00000000 to #00000000
                  -------------------------------------------------------- */
                if (styleKey === 'textColor') {
                  value.color = com.formatColor(styleValue)
                  delete value.textColor
                } else {
                  // Some list item consumers have data keys referencing color data values
                  // They are in the 0x0000000 form so we must convert them to be DOM compatible
                  if (isListPath) {
                    const dataObject =
                      context?.dataObject || findListDataObject(props)
                    if (u.isObj(dataObject)) {
                      const dataKey = nu.excludeIteratorVar(
                        styleValue,
                        iteratorVar,
                      ) as string

                      let _styleValue = com.formatColor(
                        get(dataObject, dataKey),
                      )

                      if (util.vpHeightKeys.includes(styleKey as any)) {
                        if (util.isNoodlUnit(_styleValue)) {
                          value[styleKey] = String(
                            NuiViewport.getSize(
                              _styleValue,
                              viewport?.height as number,
                              { unit: 'px' },
                            ),
                          )
                        }
                      } else {
                        value[styleKey] = _styleValue
                      }
                    } else {
                      value[styleKey] = com.formatColor(String(dataObject))
                    }
                  }

                  if (u.isStr(styleValue) && styleValue.startsWith('0x')) {
                    value[styleKey] = com.formatColor(styleValue)
                  }
                }
              }
            }
          }
        } else if (u.isStr(originalValue)) {
          // Unparsed style value (reference)
        }
      } else if (originalKey === 'viewTag') {
        props['data-viewtag'] = value
      }
    }
    /* -------------------------------------------------------
      ---- COMPONENTS
    -------------------------------------------------------- */

    if (nt.Identify.component.header(blueprint)) {
      props.style.zIndex = 100
    } else if (nt.Identify.component.image(blueprint)) {
      // Remove the height to maintain the aspect ratio since images are
      // assumed to have an object-fit of 'contain'
      if (!('height' in (blueprint.style || {}))) delete props.style.height
      // Remove the width to maintain the aspect ratio since images are
      // assumed to have an object-fit of 'contain'
      if (!('width' in (blueprint.style || {}))) delete props.style.width
      if (!('objectFit' in (blueprint.style || {}))) {
        props.style.objectFit = 'contain'
      }
    } else if (nt.Identify.component.listLike(blueprint)) {
      props.style.display =
        blueprint.style?.axis === 'horizontal' ? 'flex' : 'block'
      props.style.listStyle = 'none'
      props.style.padding = '0px'
    } else if (nt.Identify.component.listItem(blueprint)) {
      // Flipping the position to relative to make the list items stack on top of eachother.
      //    Since the container is a type: list and already has their entire height defined in absolute values,
      //    this shouldn't have any UI issues because they'll stay contained within
      props.style.listStyle = 'none'
      props.style.padding = 0
    } else if (nt.Identify.component.popUp(blueprint)) {
      props.style.visibility = 'hidden'
    } else if (nt.Identify.component.scrollView(blueprint)) {
      props.style.display = 'block'
    } else if (nt.Identify.component.textView(blueprint)) {
      props.style.rows = 10
    } else if (nt.Identify.component.video(blueprint)) {
      props.style.objectFit = 'contain'
    }

    /* -------------------------------------------------------
      ---- OTHER / UNCATEGORIZED
    -------------------------------------------------------- */

    // Shadow
    if (nt.Identify.isBooleanTrue(blueprint?.style?.shadow)) {
      props.style.boxShadow = '5px 5px 10px 3px rgba(0, 0, 0, 0.015)'
      delete props.style.shadow
    }

    // Visibility
    nt.Identify.isBooleanTrue(blueprint?.style?.isHidden) &&
      (props.style.visibility = 'hidden')

    // ??
    if (nt.Identify.isBoolean(blueprint?.required)) {
      props.required = nt.Identify.isBooleanTrue(blueprint?.required)
    }
  }

  return props
}

export default normalizeProps
