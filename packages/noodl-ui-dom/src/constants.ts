import { componentTypes, ComponentType } from 'noodl-ui'

export const componentEventMap = {
  ...componentTypes.reduce(
    (types, type) => Object.assign(types, { [type]: type }),
    {} as Record<ComponentType, ComponentType>,
  ),
  all: 'component',
  br: 'breakline',
} as const

export const componentEventTypes = Object.keys(
  componentEventMap,
) as (keyof typeof componentEventMap)[]

export const componentEventIds = Object.values(
  componentEventMap,
) as typeof componentEventMap[typeof componentEventTypes[number]][]

export const componentTagNameEventMap: Record<
  HTMLLIElement['tagName'],
  typeof componentEventIds[number]
> = {
  BR: componentEventMap.br,
  BUTTON: componentEventMap.button,
  HR: componentEventMap.divider,
  LABEL: componentEventMap.label,
  LI: componentEventMap.listItem,
  IMG: componentEventMap.image,
  INPUT: componentEventMap.textField,
  SELECT: componentEventMap.select,
  VIDEO: componentEventMap.video,
  UL: componentEventMap.list,
}
