import curry from 'lodash/curry'
import set from 'lodash/set'
import { ComponentObject, ComponentType, PageObject } from 'noodl-types'

const stateFactory = function <
  O extends Record<keyof PageObject, PageObject[keyof PageObject]>,
>(state: O & Partial<PageObject>) {
  const helpers = {
    set: curry(<P extends string>(path: P, value: any) =>
      set(state, path, value),
    ),
  }

  const o = {
    set: helpers.set,
    state,
    getHelpers() {
      return helpers
    },
  }

  return o
}

export default stateFactory
