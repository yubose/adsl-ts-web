import get from 'lodash/get'
import has from 'lodash/has'
import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import { NUIAction, NUIActionObjectInput, NuiComponent, Store } from 'noodl-ui'
import { LiteralUnion } from 'type-fest'
import { ActionMetadata } from '../app/types'
import log from '../log'

export function getActionMetadata<PKey extends string = string>(
  action: nt.ActionObject | NUIAction | undefined,
  {
    component,
    pickKeys,
    ...other
  }: Partial<Record<string, any>> & {
    component?: nt.ComponentObject | NuiComponent.Instance
    pickKeys?: PKey | PKey[]
  } = {},
) {
  const metadata = {
    action: {} as any,
    trigger: pickActionKey(action as NUIAction, 'trigger'),
    ...other,
  } as ActionMetadata<PKey>
  const isObject = isPlainAction(action)
  if (!action) return metadata
  if (isObject) {
    metadata.action.instance = undefined
    metadata.action.object = action
  } else if (action) {
    metadata.action.instance = action as NUIAction
    metadata.action.object = action['original']
  }
  pickKeys &&
    u.array(pickKeys).forEach((key: PKey) => {
      if (component) {
        // @ts-expect-error
        metadata[key] = {
          fromAction: pickActionKey(action, key),
          fromComponent: component.blueprint?.[key] || component.get(key),
        }
      } else {
        metadata[key] = pickActionKey(action, key)
      }
    })
  return metadata
}

export function getRandomKey() {
  return `_${Math.random().toString(36).substr(2, 9)}`
}

export function isChrome() {
  return (
    u.isBrowser() && navigator.userAgent.toLowerCase().indexOf('chrome') > -1
  )
}

export function isDataUrl(value = '') {
  return value.startsWith('blob:') || value.startsWith('data:')
}

/**
 * Returns whether the web app is running on a mobile browser.
 * @return { boolean }
 */
export function isMobile() {
  return typeof navigator?.userAgent === 'string'
    ? /Mobile/.test(navigator.userAgent)
    : false
}

export function isIOS() {
  return (
    typeof window !== 'undefined' &&
    /iPad|iPhone|iPod/.test(
      window.navigator.userAgent || window.navigator.vendor || '',
    ) &&
    // @ts-expect-error
    !window.MSStream
  )
}

export function isUnitTestEnv() {
  return process.env.NODE_ENV === 'test'
}

export function isPlainAction(
  action: NUIAction | NUIActionObjectInput | undefined,
): action is nt.ActionObject {
  return !!(
    action &&
    !('hasExecutor' in action || 'execute' in action) &&
    u.isObj(action)
  )
}

type ActionObjectArg =
  | Parameters<Store.BuiltInObject['fn']>[0]
  | Parameters<Store.ActionObject['fn']>[0]
  | Record<string, any>

/**
 * Gets the value of the path/property given from the key from either an action
 * instance or action object by accessing action.original[key] or action[key]
 */
export function pickActionKey<
  A extends ActionObjectArg = ActionObjectArg,
  K extends keyof (nt.ActionObject | nt.UncommonActionObjectProps) = keyof (
    | nt.ActionObject
    | nt.UncommonActionObjectProps
  ),
>(action: A, key: LiteralUnion<K, string>, defaultValue?: any) {
  if (!key) return
  let result = get(action['original'], key)
  u.isUnd(result) && (result = get(action, key, defaultValue))
  u.isUnd(result) && (result = defaultValue)
  return result
}

export function pickHasActionKey<
  A extends ActionObjectArg = ActionObjectArg,
  K extends keyof (nt.ActionObject | nt.UncommonActionObjectProps) = keyof (
    | nt.ActionObject
    | nt.UncommonActionObjectProps
  ),
>(action: A, key: LiteralUnion<K, string>) {
  if (!key || !(u.isObj(action) || u.isFnc(action))) return false
  return has(action, 'original') ? has(action.original, key) : has(action, key)
}

/**
 * Simulates a user-click and opens the link in a new tab.
 * @param { string } url - An outside link
 */
export function openOutboundURL(url: string) {
  if (typeof window !== 'undefined') {
    window.location.href = url
  }
}

export function logError(err?: any) {
  if (!err) err = new Error(`[Error] Error occurred`)
  else if (!(err instanceof Error)) err = new Error(String(err))
  log.log(`[${err.name}] ${err.message}`, err.stack)
}

/**
 * Sorts a list of objects by priority. Each item in the list is an object with an optional `priority` property with a value as a number between 1 and 5. 1 indicates the highest priority.
 */
export function sortByPriority<
  O extends Record<string, any> & { priority?: number },
>(objs: O[]) {
  return objs.sort((obj1, obj2) => {
    if (u.isObj(obj1)) {
      if (u.isObj(obj2)) {
        if ('priority' in obj1) {
          if ('priority' in obj2) {
            return (obj1.priority as number) > (obj2.priority as number)
              ? 1
              : -1
          }
          return -1
        } else if ('priority' in obj2) {
          return 1
        }
      } else {
        return -1
      }
    } else if (u.isObj(obj2)) {
      return 1
    }
    return 0
  })
}

export function throwError(err?: any) {
  if (err) {
    if (err instanceof Error) throw err
    throw new Error(String(err))
  }
  throw new Error('Error occurred')
}
