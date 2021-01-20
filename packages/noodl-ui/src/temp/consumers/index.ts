import get from 'lodash/get'
import Logger from 'logsnap'
import {
  createEmitDataKey,
  isBooleanTrue,
  isEmitObj,
  isReference,
} from 'noodl-utils'
import { isObj } from '../../utils/internal'
import { consumer as c, presets, textAlignStrings } from '../../constants'
import {
  ConsumerObject,
  EmitActionObject,
  StoreActionObject,
} from '../../types'
import { hasDecimal, hasLetter } from '../../utils/common'
import { findListDataObject } from '../../utils/noodl'
import EmitAction from '../../Action/EmitAction'

const log = Logger.create('consumers')

export default [
  {
    id: c.ids.MORPH_ALIGN,
    type: c.types.MORPH,
    prop: 'style.align',
    cond: ({ component }) => isObj(component?.style),
    resolve({ value }) {
      switch (value) {
        case 'centerX':
          return { display: 'flex', justifyContent: 'center' }
        case 'centerY':
          return { display: 'flex', alignItems: 'center' }
      }
    },
  },
  {
    id: c.ids.MORPH_AXIS,
    type: c.types.MORPH,
    prop: 'style.axis',
    cond: ({ component }) => isObj(component?.style),
    resolve({ value }) {
      if (value === 'horizontal') {
        return { display: 'flex', flexWrap: 'nowrap' }
      } else if (value === 'vertical') {
        return { display: 'flex', flexDirection: 'column' }
      }
    },
  },
  {
    id: c.ids.MORPH_BORDER,
    type: c.types.MORPH,
    prop: 'style.border',
    resolve({ value: border }) {
      const style = {} as any

      let borderStyle, color, width, line

      if (border == '0' || border == 'none') {
        style.borderStyle = 'none'
      }

      if (border && isObj(border)) {
        borderStyle = border.style
        color = border.color
        width = border.width
        line = border.line
      }

      if (color) {
        style.borderColor = String(color).replace('0x', '#')
      }
      if (line) {
        style.borderStyle = line
      }
      if (width) {
        style.borderWidth = width
      }

      // Analyizing border
      if (borderStyle == '1') {
        Object.assign(style, presets.border['1'])
      } else if (borderStyle == '2') {
        Object.assign(style, presets.border['2'])
      } else if (borderStyle == '3') {
        Object.assign(style, presets.border['3'])
        if (!width) style.borderWidth = 'thin'
      } else if (borderStyle == '4') {
        Object.assign(style, presets.border['4'])
        if (!width) style.borderWidth = 'thin'
      } else if (borderStyle == '5') {
        Object.assign(style, presets.border['5'])
      } else if (borderStyle == '6') {
        Object.assign(style, presets.border['6'])
      } else if (borderStyle == '7') {
        Object.assign(style, presets.border['7'])
      }

      if (typeof style?.borderRadius === 'string') {
        if (!hasLetter(style.borderRadius)) {
          style.borderRadius = `${style.borderRadius}px`
        }
      } else if (typeof style.borderRadius === 'number') {
        style.borderRadius = `${style.borderRadius}px`
      }

      if (style.borderWidth) {
        if (typeof style.borderWidth === 'string') {
          if (!hasLetter(style.borderWidth)) {
            style.borderWidth = `${style.borderWidth}px`
          }
        } else if (typeof style.borderWidth === 'number') {
          style.borderWidth = `${style.borderWidth}px`
        }
      }

      // If a borderRadius effect is to be expected and there is no border
      // (since no border negates borderRadius), we need to add an invisible
      // border to simulate the effect
      if (style.borderRadius) {
        const regex = /[a-zA-Z]+$/
        const radius = Number(`${style.borderRadius}`.replace(regex, ''))
        if (!isNaN(radius)) {
          style.borderRadius = `${radius}px`
          if (
            !style.borderWidth ||
            style.borderWidth === 'none' ||
            style.borderWidth === '0px'
          ) {
            // Make the border invisible
            style.borderWidth = '1px'
            style.borderColor = 'rgba(0, 0, 0, 0)'
          }
        }
      }

      return style
    },
  },
  {
    id: c.ids.REPLACE_COLOR_HEX,
    type: c.types.REPLACE,
    cond: ({ component }) => {
      if (component && typeof component?.style === 'object') {
        return Object.keys(component.style).find(
          (key) =>
            typeof component.style[key] === 'string' &&
            component.style[key].startsWith('0x'),
        )
      }
    },
    resolve({ component }) {
      Object.keys(component.style).forEach((key) => {
        const value = component.style[key]
        if (typeof value === 'string' && value.startsWith('0x')) {
          component.style[key] = value.replace('0x', '#')
        }
      })
    },
  },
  {
    id: c.ids.REPLACE_CONTENTTYPE,
    type: c.types.REPLACE,
    prop: 'contentType',
    cond: ({ component }) => component?.type !== 'label',
    resolve({ value: contentType }) {
      return contentType === 'phone'
        ? 'tel'
        : contentType === 'countryCode'
        ? 'select'
        : contentType
    },
  },
  {
    id: c.ids.MORPH_DISPLAY,
    prop: 'style.display',
    resolve({ value }) {
      return { display: value }
    },
  },
  {
    id: c.ids.FONT_FAMILY,
    prop: 'style.fontFamily',
  },
  {
    id: c.ids.HEADER,
    prop: 'type',
    cond: ({ component }) => component?.type === 'header',
    resolve({ component }) {
      if (!component.style) component.style = {}
      component.style.zIndex = 100
    },
  },
  // Remove the width/height to maintain the aspect ratio since images are
  // assumed to have an object-fit of 'contain'
  {
    id: c.ids.REMOVE_IMAGE_WIDTH,
    type: c.types.REMOVE,
    cond: ({ component, original }) =>
      component?.type === 'image' && !('width' in (original?.style || {})),
    finally: {
      resolve({ component }) {
        component.style.objectFit = 'contain'
      },
    },
  },
  {
    id: c.ids.REMOVE_IMAGE_HEIGHT,
    type: c.types.REMOVE,
    cond: ({ component, original }) =>
      component?.type === 'image' && !('height' in (original?.style || {})),
  },
  {
    id: c.ids.LIST,
    prop: 'style',
    cond: ({ component }) => component?.type === 'list',
    resolve({ component }) {
      return {
        overflowX: 'hidden',
        overflowY: 'auto',
        listStyle: 'none',
        padding: '0px',
        display: component.style?.axis === 'horizontal' ? 'flex' : 'block',
      }
    },
  },
  {
    id: c.ids.LISTITEM,
    prop: 'style',
    cond: ({ component }) => component?.type === 'listItem',
    resolve() {
      return {
        listStyle: 'none',
        padding: '0px',
        position: 'relative',
      }
    },
  },
  {
    id: c.ids.REPLACE_OPTIONS,
    prop: 'options',
    resolve({ value, getPageObject, getRoot }) {
      const toOption = (option: any, index: number) =>
        typeof option === 'string' || typeof option === 'number'
          ? {
              index,
              key: option,
              value: option,
              label: option,
            }
          : option

      if (Array.isArray(value)) {
        return value.map(toOption)
      }

      if (isReference(value)) {
        const optionsPath = value.startsWith('.')
          ? value.replace(/(..|.)/, '')
          : value
        const dataOptions =
          get(getPageObject(context.page), optionsPath) ||
          get(getRoot(), optionsPath) ||
          []
        return dataOptions.map(toOption)
      }
    },
  },
  {
    id: c.ids.REPLACE_CONTROLS,
    type: c.types.REPLACE,
    prop: 'controls',
    resolve({ value }) {
      if (typeof value === 'boolean') return value
    },
  },
  {
    id: c.ids.MORPH_PATH_RESOURCE,
    type: c.types.MORPH,
    prop: ['path', 'resource'],
    cond: ({ value }) => !!(value && !isEmitObj(value)),
    resolve({ value, createSrc }) {
      return { src: createSrc?.(value) || '' }
    },
  },
  {
    id: c.ids.MORPH_ISHIDDEN,
    type: c.types.MORPH,
    prop: 'style.isHidden',
    resolve({ value }) {
      return { visibility: value ? 'hidden' : 'visible' }
    },
  },
  {
    id: c.ids.MORPH_SHADOW,
    type: c.types.MORPH,
    prop: 'style.shadow',
    resolve({ value }) {
      if (isBooleanTrue(value)) {
        return {
          boxShadow: '5px 5px 10px 3px rgba(0, 0, 0, 0.015)',
        }
      }
    },
  },
  {
    id: c.ids.MORPH_PATH_RESOURCE_ASYNC,
    async: true,
    type: c.types.MORPH,
    prop: ['path', 'resource'],
    cond: ({ value }) => isEmitObj(value),
    async resolve({ value = '', createSrc }) {
      return { src: await createSrc?.(value) }
    },
  },
  {
    id: c.ids.REPLACE_PLACEHOLDER,
    type: c.types.REPLACE,
    async: true,
    prop: 'placeholder',
    async resolve(args) {
      const {
        value: placeholder,
        component,
        context,
        getStore,
        getPageObject,
        getRoot,
      } = args

      log.func('resolve [placeholder:emit]')

      const obj = getStore().actions.emit?.find?.(
        (o) => o.trigger === 'placeholder',
      )

      if (typeof obj?.fn === 'function') {
        const emitObj = {
          ...placeholder,
          actionType: 'emit',
        } as EmitActionObject

        const emitAction = new EmitAction(emitObj, {
          iteratorVar: component.iteratorVar,
          trigger: 'placeholder',
        })

        if ('dataKey' in (emitAction.original.emit || {})) {
          emitAction.setDataKey(
            createEmitDataKey(
              emitObj.emit.dataKey,
              [
                findListDataObject(component),
                () => getPageObject(context?.page || ''),
                () => getRoot(),
              ],
              { iteratorVar: emitAction.iteratorVar },
            ),
          )
        }

        emitAction['callback'] = async (snapshot) => {
          log.grey(`Executing emit [placeholder] action callback`, snapshot)
          const callbacks = (getStore().actions.emit || []).reduce(
            (acc, obj) =>
              obj?.trigger === 'placeholder' ? acc.concat(obj) : acc,
            [],
          )

          if (!callbacks.length) return ''

          const result = await Promise.all(
            callbacks.map((obj: StoreActionObject) =>
              obj?.fn?.(
                emitAction,
                { ...args, placeholder },
                context.actionsContext,
              ),
            ),
          )

          return (Array.isArray(result) ? result[0] : result) || ''
        }

        const result = (await emitAction.execute(placeholder)) as
          | string
          | Promise<string>

        log.grey(`Result received from emit [placeholder] action`, {
          action: emitAction,
          result,
        })

        return result
      }
    },
  },
  {
    id: c.ids.REPLACE_POSTER,
    type: c.types.REPLACE,
    prop: 'poster',
    resolve({ value: poster, createSrc }) {
      return createSrc?.(poster) || ''
    },
  },
  {
    id: c.ids.POPUP,
    prop: 'style',
    cond: ({ component }) => component?.type === 'popUp',
    resolve() {
      return { visibility: 'hidden' }
    },
  },
  {
    id: c.ids.TEXTVIEW,
    prop: 'style',
    cond: ({ component }) => component?.type === 'textView',
    resolve() {
      return { rows: 10 }
    },
  },
  {
    id: c.ids.REPLACE_FONTSIZE,
    type: c.types.REPLACE,
    prop: 'style.fontSize',
    resolve({ value: fontSize }) {
      // '10' --> '10px'
      if (
        (typeof fontSize === 'string' && !hasLetter(fontSize)) ||
        isFinite(fontSize)
      ) {
        return { fontSize: `${fontSize}px` }
      }
    },
  },
  {
    id: c.ids.MORPH_FONTSTYLE,
    type: c.types.REPLACE,
    prop: 'style.fontStyle',
    resolve({ value: fontStyle }) {
      // '10' --> '10px'
      if (fontStyle === 'bold') {
        return { fontWeight: 'bold' }
      }
    },
  },
  {
    id: c.ids.REPLACE_POSITION,
    type: c.types.REPLACE,
    cond: ({ component }) =>
      'top' in (component?.style || {}) || 'left' in (component?.style || {}),
    resolve({ key, value, component, viewport }) {
      const style = {} as any
      /**
       * Returns a ratio (in pixels) computed from a total given viewport size
       * @param { number } viewportSize - Size (in pixels) in the viewport (represents width or height)
       * @param { string | number } size - Size (raw decimal value from NOODL response) most likely in decimals. Strings are converted to numbers to evaluate the value. Numbers that aren't decimals are used as a fraction of the viewport size.
       */
      const getViewportRatio = (
        viewportSize: number,
        size: string | number,
      ) => {
        if (typeof size === 'string') {
          if (hasDecimal(size)) {
            return viewportSize * Number(size)
          } else {
            return viewportSize / Number(size)
          }
        } else if (typeof size === 'number') {
          if (hasDecimal(size)) {
            return viewportSize * Number(size)
          } else {
            return viewportSize / Number(size)
          }
        }
        return viewportSize
      }

      const handlePosition = (key: string, viewportSize: number) => {
        // String
        if (typeof value === 'string') {
          if (value == '0') {
            return '0px'
          } else if (value == '1') {
            return `${viewportSize}px`
          } else if (!hasLetter(value)) {
            return getViewportRatio(viewportSize, value) + 'px'
          }
        }
        // Number
        else if (hasDecimal(value)) {
          return getViewportRatio(viewportSize, value) + 'px'
        }

        return undefined
      }

      if (component.style?.top !== undefined) {
        style.top = handlePosition('top', viewport.height)
      }

      if (component.style?.left !== undefined) {
        style.left = handlePosition('left', viewport.width)
      }

      return style
    },
  },
  {
    id: c.ids.MORPH_TEXTCOLOR,
    type: c.types.RENAME,
    prop: 'style.textColor',
    cond: ({ component }) => 'textColor' in (component.style || {}),
    resolve({ value }) {
      return { color: value.replace('0x', '#') }
    },
  },
  {
    id: c.ids.MORPH_TEXTALIGN,
    type: c.types.MORPH,
    prop: 'style.textAlign',
    cond: ({ component }) => isObj(component?.style),
    resolve({ value, component }) {
      /**
       *  Returns an object transformed using the value of textAlign
       * @param { object } style
       * @param { string } textAlign - NOODL textAlign value
       */
      const getTextAlign = (textAlign: string): undefined | object => {
        if (!textAlignStrings.includes(textAlign)) return
        if (textAlign === 'centerX') {
          return { textAlign: 'center' }
        } else if (textAlign === 'centerY') {
          return { display: 'flex', alignItems: 'center' }
        } else {
          // NOTE: careful about passing "y" into here
          switch (textAlign) {
            case 'left':
            case 'center':
            case 'right':
              return { textAlign }
            default:
              return
          }
        }
      }

      // "centerX", "centerY", "left", "center", "right"
      if (typeof component.style.textAlign === 'string') {
        value = getTextAlign(component.style.textAlign)
        if (value) return value
      }
      // { x, y }
      else if (isObj(component.style.textAlign)) {
        const { x, y } = component.style.textAlign
        if (x !== undefined) {
          return getTextAlign(x)
        }
        if (y !== undefined) {
          value = getTextAlign(y)
          if (value) {
            // The y value needs to be handled manually here since getTextAlign will
            //    return { textAlign } which is meant for x
            if (y === 'center') {
              return { display: 'flex', alignItems: 'center' }
            }
            return value
          }
        }
        // If it's still an object delete it since it is invalid (and that we forgot)
      }
    },
  },
  {
    id: c.ids.REPLACE_WIDTH,
    prop: ['style.width', 'style.height'],
    cond: ({ component }) =>
      component?.style?.width !== undefined ||
      component?.style?.height !== undefined,
    resolve({ key, styleKey, value, viewport }) {
      /**
       * Takes a value and a full viewport size and returns a computed value in px
       * @param { string | number } value - width / height value
       * @param { number } viewportSize
       */
      const getSize = (value: string | number, viewportSize: number) => {
        if (value == '0') {
          return '0px'
        } else if (value == '1') {
          return `${viewportSize}px`
        } else {
          if (typeof value === 'string') {
            if (!hasLetter(value)) {
              if (hasDecimal(value)) {
                return `${Number(value) * viewportSize}px`
              } else {
                return `${value}px`
              }
            } else {
              // Assuming it already has a 'px' appended
              return value
            }
          } else if (isFinite(value)) {
            if (hasDecimal(value)) {
              return `${value * viewportSize}px`
            } else {
              return `${value}px`
            }
          }
          return value
        }
      }

      return String(getSize(value, viewport[styleKey] as number))
    },
  },
  {
    id: c.ids.REPLACE_ZINDEX,
    prop: 'style.zIndex',
    resolve({ value }) {
      return Number(value)
    },
  },
  {
    id: c.ids.REQUIRED,
    prop: 'required',
    resolve({ value: required }) {
      return isBooleanTrue(required)
    },
  },
  {
    id: c.ids.VIDEO,
    prop: 'style.objectFit',
    resolve() {
      return 'contain'
    },
  },
  {
    id: c.ids.REPLACE_VIDEOFORMAT,
    type: c.types.REPLACE,
    prop: 'videoFormat',
    resolve({ value }) {
      return `video/${value}`
    },
  },
] as const
