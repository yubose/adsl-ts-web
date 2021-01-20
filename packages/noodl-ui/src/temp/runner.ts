import { WritableDraft } from 'immer/dist/internal'
import { ComponentObject } from 'noodl-types'
import { AnyFn } from '../types'

const runner = (function () {
  const o = {
    run(args: { component: WritableDraft<ComponentObject>; draw: AnyFn }) {
      const { component, draw, ...rest } = args

      if (component) {
        draw(args)
        if (Array.isArray(component.children)) {
          const numChildren = component.children.length
          for (let index = 0; index < numChildren; index++) {
            draw({ component: component.children[index], draw, ...rest })
          }
        } else if (component.children) {
          draw({ component: component.children, draw, ...rest })
        }
      }
    },
  }

  return o
})()

export default runner
