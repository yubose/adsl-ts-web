import * as u from '@jsmanifest/utils'
import {} from 'noodl-ui'
import type App from '../App'

/**
 * All functions in this file will be registered as getter accessors in the window object during runtime
 */

export class WindowDebugUtils {
  #app: App
  constructor(app: App) {
    this.#app = app
  }
  get app() {
    return this.#app
  }
}

export function findComponentsWithKys(this: App, ...keys: string[]) {
  const regexp = new RegExp(`(${keys.join('|')})`)
  return this.cache.component.filter((obj) =>
    Array.from(
      new Set(
        u
          .keys(obj?.component?.blueprint || {})
          .concat(u.keys(obj?.component?.props || {})),
      ),
    ).some((key) => regexp.test(key)),
  )
}
