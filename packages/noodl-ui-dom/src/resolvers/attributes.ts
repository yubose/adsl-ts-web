import * as u from '@jsmanifest/utils'
import startOfDay from 'date-fns/startOfDay'
import { Identify, userEvent } from 'noodl-types'
import { dataAttributes, NUIComponent } from 'noodl-ui'
import { isDisplayable, normalizeEventName } from '../utils'
import NDOMResolver from '../Resolver'
import * as t from '../types'
import * as i from '../utils/internal'
import * as c from '../constants'

const is = Identify

function attachText<N extends t.NDOMElement>(node: N, ...text: string[]) {
  if (!node.innerHTML.trim()) {
    const value = text.find(Boolean) || ''
    node.innerHTML = isDisplayable(value) ? value : ''
  }
  return node
}

function attachDataAttrs<N extends t.NDOMElement>(
  node: N,
  component: NUIComponent.Instance,
  setAttr: ReturnType<NDOMResolver['getOptions']>['setAttr'],
  setDataAttr: ReturnType<NDOMResolver['getOptions']>['setDataAttr'],
) {
  dataAttributes.forEach((key) => {
    if (component?.get?.(key)) {
      setDataAttr(key, component.get(key) || '')
      'value' in node &&
        key === c.DATA_VALUE &&
        setAttr('value' as any, component.get(key))
    }
  })
}

function attachUserEvents<N extends t.NDOMElement>(
  node: N,
  component: NUIComponent.Instance,
) {
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
}

function handleKeyPress<N extends t.NDOMElement>(node: N) {
  function onKeyPress(n: N, evt: KeyboardEvent) {
    if (evt.key === 'Enter') {
      const inputs = document.querySelectorAll('input')
      const currentIndex = [...inputs].findIndex((el) => n.isEqualNode(el))
      const targetIndex = (currentIndex + 1) % inputs.length
      if (currentIndex + 1 < inputs.length) inputs[targetIndex]?.focus?.()
    }
  }
  node.addEventListener('keypress', onKeyPress.bind(null, node))
}

const attributesResolver: t.Resolve.Config = {
  name: `[noodl-ui-dom] attributes`,
  before({ elementType, component, node, setAttr, setStyleAttr }) {
    if (node && component) {
      setAttr('id', component.id || '')
      if (elementType === 'SCRIPT') {
        if (component.has('global')) {
          component.on('image', (src: string) =>
            setStyleAttr('backgroundImage', `url("${src}")`),
          )
        }
      }
    }
  },
  resolve(args) {
    const { elementType, setAttr, setDataAttr, setStyleAttr } = args

    if (args.node) {
      if (args.component) {
        const { path, placeholder, style, textBoard } =
          args.component.blueprint || {}

        /* -------------------------------------------------------
          ---- GENERAL / COMMON DOM NODES
        -------------------------------------------------------- */
        attachText(
          args.node,
          args.component?.get?.(c.DATA_VALUE),
          args.component?.blueprint?.text,
        )
        /* -------------------------------------------------------
          ---- DATA-ATTRIBUTES
        -------------------------------------------------------- */
        attachDataAttrs(args.node, args.component, setAttr, setDataAttr)
        /* -------------------------------------------------------
          ---- EVENTS
        -------------------------------------------------------- */
        attachUserEvents(args.node, args.component)
        /* -------------------------------------------------------
          ---- ENTER KEY FOR INPUTS
        -------------------------------------------------------- */
        elementType === 'INPUT' && handleKeyPress(args.node)
        /* -------------------------------------------------------
          ---- NON TEXTFIELDS
        -------------------------------------------------------- */
        if (!['INPUT', 'SELECT', 'TEXTAREA'].includes(elementType)) {
          if (
            ['text', c.DATA_PLACEHOLDER, c.DATA_VALUE].some(
              (key) => !!args.component.get(key),
            )
          ) {
            let dataValue = args.component.get(c.DATA_VALUE)
            let placeholder = args.component.get(c.DATA_PLACEHOLDER)
            let text = args.component.get('text')
            text = (u.isStr(dataValue) ? dataValue : text) || text || ''
            !text && placeholder && (text = placeholder)
            !text && (text = '')
            text && args.node && setAttr('innerHTML', `${text}`)
          }
        }

        /* -------------------------------------------------------
          ---- PATHS (non videos)
        -------------------------------------------------------- */
        if (path && !['IFRAME', 'VIDEO'].includes(elementType)) {
          if (args.component.get(c.DATA_SRC)) {
            const src = args.component.get(c.DATA_SRC)
            ;[setAttr, setDataAttr].forEach((fn) => fn('src', src))
            args.component.on('path', (result) => {
              ;[setAttr, setDataAttr].forEach((fn) => fn('src', result))
            })
          }
        }

        /* -------------------------------------------------------
          ---- PLACEHOLDERS
        -------------------------------------------------------- */
        if (placeholder) {
          const value =
            args.component.get(c.DATA_PLACEHOLDER) || placeholder || ''

          if (Identify.folds.emit(value)) {
            args.component.on('placeholder', (result) => {
              setTimeout(() => {
                ;[setAttr, setDataAttr].forEach((fn) =>
                  fn('placeholder', result),
                )
              })
            })
          } else {
            ;[setAttr, setDataAttr].forEach((fn) => fn('placeholder', value))
          }
        }

        /* -------------------------------------------------------
          ---- STYLES
        -------------------------------------------------------- */
        if (!i._isScriptEl(args.node) && u.isObj(style)) {
          u.isObj(args.component.style.textAlign) &&
            delete args.component.style.textAlign

          if (
            !('marginTop' in args.component.style) ||
            !('marginTop' in (style || {}))
          ) {
            args.component.style.marginTop = '0px'
          }

          for (const [k, v] of u.entries(args.component.style)) {
            if (Number.isFinite(Number(k))) continue
            args.node.style && setStyleAttr(k, String(v))
          }

          if (Identify.component.canvas(args.component)) {
            if (args.node.parentElement) {
              const parentWidth = args.node.parentElement.style.width
              const parentHeight = args.node.parentElement.style.height
              setAttr('width', Number(parentWidth.replace(/[a-zA-Z]+/g, '')))
              setAttr('height', Number(parentHeight.replace(/[a-zA-Z]+/g, '')))
              setStyleAttr('width', parentWidth)
              setStyleAttr('height', parentHeight)
            }
          }
        }

        /* -------------------------------------------------------
          ---- TEXT=FUNC
        -------------------------------------------------------- */
        if (args.component.blueprint?.['text=func']) {
          if (args.component.contentType === 'timer') {
            const dataKey = args.component.blueprint?.dataKey as string
            // TODO - Refactor a better way to get the initial value since the
            // call order isn't guaranteed
            args.component.on('timer:init', (initialValue?: Date) => {
              const timer =
                args.global.timers.get(dataKey) ||
                args.global.timers.set(dataKey, {
                  initialValue: initialValue || startOfDay(new Date()),
                  pageName: args.page.page,
                })

              if (initialValue && timer.value !== initialValue) {
                timer.value = initialValue
              }

              timer.pageName !== args.page.page &&
                (timer.pageName = args.page.page)

              timer.on('increment', (value) => {
                args.component.emit('timer:interval', value)
              })
              args.component.emit('timer:ref', timer)

              args.page.once(c.eventId.page.on.ON_DOM_CLEANUP, () => {
                timer.clear()
                timer.onClear = undefined
                timer.onIncrement = undefined
                args.component.clear('hooks')
              })
            })
          } else {
            args.node &&
              setAttr('textContent', args.component.get('data-value') || '')
          }
        }

        /* -------------------------------------------------------
          ---- TEMP - Experimenting CSS
        -------------------------------------------------------- */
        is.component.canvas(args.component) &&
          i.addClassName('canvas', args.node)
        is.component.page(args.component) && i.addClassName('page', args.node)
        is.component.popUp(args.component) && i.addClassName('popup', args.node)
        is.component.scrollView(args.component) &&
          i.addClassName('scroll-view', args.node)
        args.component.has?.('global') && i.addClassName('global', args.node)
        textBoard && i.addClassName('text-board', args.node)
      }
    }
  },
}

export default attributesResolver
