import type { LiteralUnion } from 'type-fest'
import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import Resolver from '../Resolver'
import resolveReference from '../utils/resolveReference'
import resolvePageComponentUrl from '../utils/resolvePageComponentUrl'
import * as i from '../utils/internal'
import * as t from '../types'

const setupResolver = new Resolver('resolveSetup')

setupResolver.setResolver(async function setupResolver(
  component,
  options,
  next,
) {
  try {
    const { createActionChain, getRoot, on, page } = options
    const original = component.blueprint || {}

    if (u.isObj(original)) {
      const origGet = component.get.bind(component)

      const _getter = function getter(
        this: t.NuiComponent.Instance,
        key: string,
      ) {
        let value = this.blueprint[key]

        if (u.isStr(value)) {
          if (nt.Identify.pageComponentUrl(value)) {
            return resolvePageComponentUrl({
              component,
              page,
              key,
              value,
              localKey: page?.page,
              on,
              root: getRoot,
            })
          }

          if (nt.Identify.reference(value)) {
            return resolveReference({
              component,
              page,
              key,
              value,
              localKey: page?.page,
              on,
              root: getRoot,
            })
          }
        } else if (nt.Identify.if(value)) {
          if (on?.if) {
            value = on.if({ component, page, key, value })
              ? value.if?.[1]
              : value.if?.[2]

            if (nt.Identify.reference(value)) {
              return resolveReference({
                component,
                page,
                key,
                value,
                localKey: page?.page,
                on,
                root: getRoot,
              })
            }

            return value
          }

          value = i.defaultResolveIf(value)

          if (nt.Identify.reference(value)) {
            const result = resolveReference({
              component,
              page,
              key,
              value,
              localKey: page?.page,
              on,
              root: getRoot,
            })
            return result
          }

          return value
        } else if (!this) return origGet?.(key)

        return origGet(key)
      }

      Object.defineProperty(component, 'get', {
        configurable: true,
        enumerable: true,
        get() {
          return _getter.bind(this)
        },
      })

      /* -------------------------------------------------------
        ---- USER EVENTS (onClick, onHover, onBlur, etc)
      -------------------------------------------------------- */

      // @ts-expect-error
      nt.userEvent.concat('postMessage').forEach((eventType) => {
        if (original[eventType]) {
          const actionChain = createActionChain(
            eventType,
            original[eventType] as t.NUIActionObject[],
          )
          on?.actionChain && actionChain.use(on.actionChain)
          component.edit({ [eventType]: actionChain })
          // @ts-expect-error
          eventType !== 'postMessage' && (component.style.cursor = 'pointer')
        }

        if (original.onTextChange) {
          const actionChain = createActionChain(
            'onInput',
            original.onTextChange,
          )
          component.edit({ ['onInput']: actionChain })
          on?.actionChain && actionChain.use(on.actionChain)
        }
      })

      /* -------------------------------------------------------
        ---- EMITS
      -------------------------------------------------------- */

      for (const prop of [
        'path',
        'placeholder',
        { trigger: 'dataValue', datasetKey: 'value' },
      ]) {
        let datasetKey = ''
        let trigger = '' as LiteralUnion<t.NUITrigger, string>

        if (u.isObj(prop)) {
          datasetKey = prop.datasetKey
          trigger = prop.trigger
        } else {
          datasetKey = trigger = prop
        }

        if (nt.Identify.folds.emit(original[trigger])) {
          const actionChain = createActionChain('', [
            { emit: original[trigger].emit, actionType: 'emit' },
          ])
          on?.actionChain && actionChain.use(on.actionChain)
          await on?.emit?.createActionChain?.({
            actionChain,
            actions: original[trigger].emit?.actions || [],
            component,
            trigger: trigger as t.NUITrigger,
          })
        }
      }
    }
  } catch (error) {
    console.error(error)
  }

  return next?.()
})

export default setupResolver
