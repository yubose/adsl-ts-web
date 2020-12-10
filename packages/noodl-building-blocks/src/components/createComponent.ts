import { ComponentObject } from 'noodl-types'

function createComponent<C extends ComponentObject = any>(
  type: string,
  opts?: Partial<ComponentObject>,
): C {
  return {
    type,
    style: {},
    ...opts,
  } as C
}

export default createComponent
