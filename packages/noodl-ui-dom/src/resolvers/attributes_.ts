import * as u from '@jsmanifest/utils'
import h from 'virtual-dom/h'
import diff from 'virtual-dom/diff'
import createElement from 'virtual-dom/create-element'
import patch from 'virtual-dom/patch'
import VNode from 'virtual-dom/vnode/vnode'
import VText from 'virtual-dom/vnode/vtext'
import Delegator from 'dom-delegator'
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
  for (const key of dataAttributes) {
    if (component?.get?.(key)) {
      setDataAttr(key, component.get(key) || '')
      'value' in node &&
        key === c.DATA_VALUE &&
        setAttr('value' as any, component.get(key))
    }
  }
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

const attributesResolver: t.Resolve_.Config = {
  name: `[ndom] attributes`,
  async before({ elementType, component, vnode, setAttr, setStyleAttr }) {
    const props = { id: component.id || '' } as Record<string, any>
    const styles = {} as Record<string, any>

    if (elementType === 'SCRIPT') {
      if (component.has('global')) {
        if (!component.get('data-src')) {
          component.on('image', (src: string) => {
            setStyleAttr('backgroundImage', `url("${src}")`)
          })
        }
        setStyleAttr('backgroundImage', `url("${component.get('data-src')}")`)
      }
    }
    return {
      id: component.id || '',
    }
  },
  async resolve(args) {
    const { elementType, setAttr, setDataAttr, setStyleAttr } = args

    if (args.vnode) {
      if (elementType === 'SCRIPT') {
        if (args.component.has('global')) {
          if (!args.component.get('data-src')) {
            args.component.on('image', (src: string) => {
              setStyleAttr('backgroundImage', `url("${src}")`)
            })
          }
          setStyleAttr(
            'backgroundImage',
            `url("${args.component.get('data-src')}")`,
          )
        }
      }

      if (args.component) {
        const { path, placeholder, style, textBoard } =
          args.component.blueprint || {}

        /* -------------------------------------------------------
          ---- GENERAL / COMMON DOM NODES
        -------------------------------------------------------- */
        attachText(
          args.vnode,
          args.component?.get?.(c.DATA_VALUE),
          args.component?.blueprint?.text,
        )
        /* -------------------------------------------------------
          ---- DATA-ATTRIBUTES
        -------------------------------------------------------- */
        attachDataAttrs(args.vnode, args.component, setAttr, setDataAttr)
        /* -------------------------------------------------------
          ---- EVENTS
        -------------------------------------------------------- */
        attachUserEvents(args.vnode, args.component)
        /* -------------------------------------------------------
          ---- ENTER KEY FOR INPUTS
        -------------------------------------------------------- */
        elementType === 'INPUT' && handleKeyPress(args.vnode)
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
            text && args.vnode && setAttr('innerHTML', `${text}`)
          }
        }

        /* -------------------------------------------------------
          ---- PATHS (non videos)
        -------------------------------------------------------- */
        if (path && !['IFRAME', 'VIDEO'].includes(elementType)) {
          if (args.component.get(c.DATA_SRC)) {
            const src = args.component.get(c.DATA_SRC)
            u.forEach((fn) => fn('src', src), [setAttr, setDataAttr])
            args.component.on('path', (result) =>
              u.forEach((fn) => fn('src', result), [setAttr, setDataAttr]),
            )
          }
        }

        /* -------------------------------------------------------
          ---- PLACEHOLDERS
        -------------------------------------------------------- */
        if (placeholder) {
          const value =
            args.component.get(c.DATA_PLACEHOLDER) || placeholder || ''

          if (Identify.folds.emit(value)) {
            u.forEach((fn) => fn('placeholder', value), [setAttr, setDataAttr])
            args.component.on('placeholder', (val) =>
              u.forEach((fn) => fn('placeholder', val), [setAttr, setDataAttr]),
            )
          } else {
            u.forEach((fn) => fn('placeholder', value), [setAttr, setDataAttr])
          }
        }

        /* -------------------------------------------------------
          ---- STYLES
        -------------------------------------------------------- */
        if (!i._isScriptEl(args.vnode) && u.isObj(style)) {
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
            args.vnode.style && setStyleAttr(k as any, String(v))
          }

          if (Identify.component.canvas(args.component)) {
            if (args.vnode.parentElement) {
              const parentWidth = args.vnode.parentElement.style.width
              const parentHeight = args.vnode.parentElement.style.height
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
              const pageName = args.page.page
              const timer =
                args.global.timers.get(dataKey) ||
                args.global.timers.set(dataKey, {
                  initialValue: initialValue || startOfDay(new Date()),
                  pageName,
                })

              if (initialValue && timer.value !== initialValue) {
                timer.value = initialValue
              }

              timer.pageName !== pageName && (timer.pageName = pageName)

              timer.on('increment', (v: any) =>
                args.component.emit('timer:interval', v),
              )
              args.component.emit('timer:ref', timer)

              args.page.once(c.eventId.page.on.ON_DOM_CLEANUP, () => {
                timer.clear()
                timer.onClear = undefined
                timer.onIncrement = undefined
                args.component.clear('hooks')
              })
            })
          } else {
            args.vnode &&
              setAttr('textContent', args.component.get('data-value') || '')
          }
        }

        /* -------------------------------------------------------
          ---- TEMP - Experimenting CSS
        -------------------------------------------------------- */
        const classes = {
          canvas: 'canvas',
          global: {
            identify: (c: NUIComponent.Instance) => c.has('global'),
            className: 'global',
          },
          page: 'page',
          popUp: 'popup',
          scrollView: 'scroll-view',
          textBoard: 'text-board',
        } as const

        u.forEach(
          ([name, className]) =>
            [is.component[name] || classes[name]?.['identify']].find(u.isFnc)?.(
              args.component,
            ) &&
            i.addClassName(
              u.isStr(className)
                ? className
                : classes[name]?.['className'] || '',
              args.vnode,
            ),
          u.entries(classes),
        )
      }
    }
  },
}

export default attributesResolver
