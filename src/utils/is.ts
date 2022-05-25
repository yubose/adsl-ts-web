import { Identify } from 'noodl-types'
import type { CADL } from '@aitmed/cadl'
import type { NuiComponent } from 'noodl-ui'

const is = {
  ...Identify,
  lvl3Sdk: (arg: unknown): arg is CADL => {
    return !!(
      arg &&
      typeof arg === 'object' &&
      ['initPage', 'emitCall'].every((key) => key in arg)
    )
  },
  /**
   * Returns true if the component has any of these props:
   * 1. audioStream: true
   * 2. videoStream: true
   * 3. viewTag: 'selfStream'
   * @param { NuiComponent.Instance } component
   * @returns { boolean }
   */
  isGlobalStreamComponent: (component: NuiComponent.Instance) => {
    return !!(
      component.blueprint?.audioStream ||
      component.blueprint?.videoStream ||
      component.blueprint?.viewTag === 'selfStream'
    )
  },
}

export default is
