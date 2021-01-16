import produce from 'immer'
import { WritableDraft } from 'immer/dist/internal'
import { ComponentObject } from 'noodl-types'
import { AnyFn } from '../types'

const runner = (function () {
  const o = {
    run(component: WritableDraft<ComponentObject>, resolve: AnyFn) {
      if (component) {
        resolve(component)
        if (Array.isArray(component.children)) {
          const numChildren = component.children.length
          for (let index = 0; index < numChildren; index++) {
            component.children[index] = _execute(component.children[index])
          }
        } else if (component.children) {
          component.children = _execute(component.children)
        }
      }
      return component
    },
  }

  return o
})()

export default runner
