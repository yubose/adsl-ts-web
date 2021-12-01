import get from 'lodash/get'
import has from 'lodash/has'
import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import { NUIAction, NUIActionObjectInput, NuiComponent, Store } from 'noodl-ui'
import { LiteralUnion } from 'type-fest'
import { ActionMetadata } from '../app/types'

export function getActionMetadata<PKey extends string = string>(
  action: NUIAction | nt.ActionObject | undefined,
  {
    component,
    pickKeys,
    ...other
  }: {
    component?: NuiComponent.Instance | nt.ComponentObject
    pickKeys?: PKey | PKey[]
  } & Partial<Record<string, any>> = {},
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
  console.log(`[${err.name}] ${err.message}`, err.stack)
}

export function throwError(err?: any) {
  if (err) {
    if (err instanceof Error) throw err
    throw new Error(String(err))
  }
  throw new Error('Error occurred')
}
