import produce from 'immer'
import { WritableDraft } from 'immer/dist/internal'
import { ComponentObject } from 'noodl-types'
import { AnyFn } from '../types'

const runner = (function () {
  class RunnerPath {
    component: ComponentObject

    children = [] as ComponentObject[]

    constructor(component: ComponentObject) {
      this.component = component
    }
  }

  const o = {
    run(component: WritableDraft<ComponentObject>, resolve: AnyFn) {
      if (component) {
        const runnerPath = new RunnerPath(component)
        resolve(component)
        if (Array.isArray(component.children)) {
          const numChildren = component.children.length
          for (let index = 0; index < numChildren; index++) {
            runnerPath.children[0]
            resolve(component.children[index])
          }
        } else if (component.children) {
          resolve(component.children)
        }
      }
    },
  }

  return o
})()

export default runner
