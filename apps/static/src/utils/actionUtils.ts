import * as u from '@jsmanifest/utils'
import is from './is'
import type { EmitObjectFold, IfObject, ReferenceString } from 'noodl-types'

export interface ActionUtilsOptions {
  use?: {
    ref?: (ref: ReferenceString) => Promise<any>
    goto?: (destination?: Record<string, any> | string) => any
  }
}

export async function handleEmitObject(path: EmitObjectFold) {
  try {
    let dataKey = path.emit?.dataKey
    let actions = path.emit?.actions

    if (actions) {
      for (const action of u.array(actions)) {
        // if ()
      }
    }
  } catch (error) {}
}

export async function handleIfObject(
  ifObject: IfObject | { if: IfObject },
  options: ActionUtilsOptions = {},
) {
  try {
    const [cond, t, f] = u.array('if' in ifObject ? ifObject.if : ifObject)

    if (u.isBool(cond)) {
      return handleValue(cond ? t : f, options)
    }

    const condResult = await handleCondition(cond, options)

    return handleValue(condResult ? t : f, options)
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    throw err
  }
}

export async function handleCondition(
  cond: any,
  options: ActionUtilsOptions = {},
) {
  if (u.isBool(cond)) return cond
  if (u.isStr(cond)) {
    if (is.reference(cond)) {
      return handleCondition(await handleValue(cond, options))
    }
    if (is.isBoolean(cond)) {
      if (cond === 'true') return true
      return false
    }
  }
  return Boolean(cond)
}

export async function handleValue(
  value: unknown,
  options: ActionUtilsOptions = {},
) {
  const { use = {} } = options

  if (u.isStr(value)) {
    if (is.reference(value)) {
      if (u.isFnc(use.ref)) {
        const refValue = await use.ref(value)
        return handleValue(refValue, options)
      }
    }
  }

  if (u.isArr(value)) {
    return Promise.all(value.map((val) => handleValue(val, options)))
  }

  if (u.isFnc(value)) {
    return value()
  }

  if (u.isObj(value)) {
    if (is.folds.emit(value)) {
      return handleValue(await handleEmitObject(value), options)
    }

    if (is.folds.if(value)) {
      return handleIfObject(value, options)
    }

    if (is.folds.goto(value)) {
      return use?.goto?.(value)
    }

    if (is.dynamicAction(value)) {
      //
    }
  }

  return value
}

export async function handleSamePageScroll(
  navigate: (to: string) => Promise<void>,
  destination: string,
) {
  // TODO - Handle goto scrolls when navigating to a different page
  let scrollingTo = destination

  if (destination.startsWith('^')) {
    scrollingTo = destination.substring(1)
    destination = destination.substring(1)
  }

  const scrollToElem = document.querySelector(`[data-viewtag=${scrollingTo}]`)

  if (scrollToElem) {
    scrollToElem.id = scrollingTo
    scrollToElem.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
    })
  } else {
    await navigate(`/${destination}/index.html`)
  }
}
