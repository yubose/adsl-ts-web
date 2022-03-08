import { Identify } from 'noodl-types'
import type { NuiComponent } from 'noodl-ui'

const is = {
  ...Identify,
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
