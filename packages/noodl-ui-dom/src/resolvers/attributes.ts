import * as u from '@jsmanifest/utils'
import startOfDay from 'date-fns/startOfDay'
import { Identify, userEvent } from 'noodl-types'
import { dataAttributes } from 'noodl-ui'
import { Resolve } from '../types'
import { isDisplayable, isTextFieldLike, normalizeEventName } from '../utils'
import * as i from '../utils/internal'
import * as c from '../constants'

const is = Identify

const resolveAttributes: Resolve.Config = {
  name: `[noodl-ui-dom] attributes`,
  cond: (n, c) => !!(n && c),
  before(node, component) {
    if (node) {
      if (component) {
        node.id = component.id || ''

        if (node instanceof HTMLScriptElement) {
          if (component.has('global')) {
            component.on('image', (src) => {
              node && (node.style.backgroundImage = `url("${src}")`)
            })
          }
        }
      }
    }
  },
  resolve(node, component, { global: globalMap, ndom, page }) {
    if (node) {
      if (component) {
        const { path, placeholder, style, textBoard } =
          component.blueprint || {}

        /* -------------------------------------------------------
          ---- GENERAL / COMMON DOM NODES
        -------------------------------------------------------- */
        if (!node.innerHTML.trim()) {
          if (isDisplayable(component.get(c.DATA_VALUE))) {
            node.innerHTML = `${component.get(c.DATA_VALUE)}`
          } else if (isDisplayable(component.get('text'))) {
            node.innerHTML = `${component.get('text')}`
          }
        }

        /* -------------------------------------------------------
          ---- DATA-ATTRIBUTES
        -------------------------------------------------------- */
        dataAttributes.forEach((key) => {
          if (component?.get?.(key)) {
            node.dataset[key.replace('data-', '')] = component.get(key) || ''
            if ('value' in node && key === c.DATA_VALUE) {
              ;(node as HTMLInputElement).value = component.get(key)
            }
          }
        })

        /* -------------------------------------------------------
          ---- EVENTS
        -------------------------------------------------------- */
        userEvent.forEach((eventType: string) => {
          if (u.isFnc(component.get?.(eventType)?.execute)) {
            /**
             * Putting a setTimeout here helps to avoid the race condition in
             * where the emitted action handlers are being called before local
             * root object gets their data values updated.
             */
            node.addEventListener(normalizeEventName(eventType), (e) =>
              setTimeout(() => component.get(eventType)?.execute?.(e)),
            )
          }
        })
        /* -------------------------------------------------------
          ---- ENTER KEY FOR INPUTS
        -------------------------------------------------------- */
        node.addEventListener('keypress', function (e: KeyboardEvent) {
          if (e.key === 'Enter') {
            const inputs = document.querySelectorAll('input')
            const currentIndex = [...inputs].findIndex((el) =>
              node.isEqualNode(el),
            )
            const targetIndex = (currentIndex + 1) % inputs.length
            if (currentIndex + 1 < inputs.length) inputs[targetIndex]?.focus?.()
          }
        })

        /* -------------------------------------------------------
          ---- NON TEXTFIELDS
        -------------------------------------------------------- */
        if (!isTextFieldLike(node)) {
          if (
            ['text', c.DATA_PLACEHOLDER, c.DATA_VALUE].some((key) =>
              component.get(key),
            )
          ) {
            let dataValue = component.get(c.DATA_VALUE)
            let placeholder = component.get(c.DATA_PLACEHOLDER)
            let text = component.get('text')
            text = (u.isStr(dataValue) ? dataValue : text) || text || ''
            !text && placeholder && (text = placeholder)
            !text && (text = '')
            text && node && (node.innerHTML = `${text}`)
          }
        }

        /* -------------------------------------------------------
          ---- PATHS (non videos)
        -------------------------------------------------------- */
        if (
          path &&
          ['IFRAME', 'VIDEO'].every((tagName) => node.tagName !== tagName)
        ) {
          if (component.get(c.DATA_SRC) && 'src' in (node as any)) {
            node.dataset.src = component.get(c.DATA_SRC)
            ;(node as HTMLImageElement).src = component.get(c.DATA_SRC)
            component.on('path', (result) => {
              ;(node as HTMLImageElement).src = result
              node.dataset && (node.dataset.src = result)
            })
          }
        }

        /* -------------------------------------------------------
          ---- PLACEHOLDERS
        -------------------------------------------------------- */
        if (placeholder) {
          const value = component.get('data-placeholder') || placeholder || ''
          if (Identify.folds.emit(value)) {
            component.on('placeholder', (result) => {
              setTimeout(() => {
                ;(node as HTMLInputElement).placeholder = result
                node.dataset.placeholder = result
              })
            })
          } else {
            ;(node as HTMLInputElement).placeholder = value
            node.dataset.placeholder = value
          }
        }

        /* -------------------------------------------------------
          ---- STYLES
        -------------------------------------------------------- */
        if (!(node instanceof HTMLScriptElement) && u.isObj(style)) {
          u.isObj(component.style.textAlign) && delete component.style.textAlign

          if (
            !('marginTop' in component.style) ||
            !('marginTop' in (style || {}))
          ) {
            component.style.marginTop = '0px'
          }

          for (const [k, v] of u.entries(component.style)) {
            if (Number.isFinite(Number(k))) continue
            node.style && (node.style[k] = String(v))
          }

          if (Identify.component.canvas(component)) {
            if (node.parentElement) {
              const parentWidth = node.parentElement.style.width
              const parentHeight = node.parentElement.style.height
              ;(node as HTMLCanvasElement).width = Number(
                parentWidth.replace(/[a-zA-Z]+/g, ''),
              )
              ;(node as HTMLCanvasElement).height = Number(
                parentHeight.replace(/[a-zA-Z]+/g, ''),
              )
              node.style.width = parentWidth
              node.style.height = parentHeight
            }
          }
        }

        /* -------------------------------------------------------
          ---- TEXT=FUNC
        -------------------------------------------------------- */
        if (component.blueprint?.['text=func']) {
          if (component.contentType === 'timer') {
            const dataKey = component.blueprint?.dataKey as string
            // TODO - Refactor a better way to get the initial value since the
            // call order isn't guaranteed
            component.on('timer:init', (initialValue?: Date) => {
              const timer =
                globalMap.timers.get(dataKey) ||
                globalMap.timers.set(dataKey, {
                  initialValue: initialValue || startOfDay(new Date()),
                  pageName: page.page,
                })

              if (initialValue && timer.value !== initialValue) {
                timer.value = initialValue
              }

              timer.pageName !== page.page && (timer.pageName = page.page)

              timer.on('increment', (value) => {
                // @ts-expect-error
                component.emit('timer:interval', value)
              })
              // @ts-expect-error
              component.emit('timer:ref', timer)

              ndom.page.once(c.eventId.page.on.ON_DOM_CLEANUP, () => {
                timer.clear()
                timer.onClear = undefined
                timer.onIncrement = undefined
                component.clear('hooks')
              })
            })
          } else {
            node && (node.textContent = component.get('data-value') || '')
          }
        }

        /* -------------------------------------------------------
          ---- TEMP - Experimenting CSS
        -------------------------------------------------------- */
        is.component.canvas(component) && i.addClassName('canvas', node)
        is.component.page(component) && i.addClassName('page', node)
        is.component.popUp(component) && i.addClassName('popup', node)
        is.component.scrollView(component) &&
          i.addClassName('scroll-view', node)
        component.has?.('global') && i.addClassName('global', node)
        textBoard && i.addClassName('text-board', node)
      }
    }
  },
}

export default resolveAttributes
