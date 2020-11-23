export const componentEventMap = {
  all: 'component',
  button: 'button',
  br: 'breakline',
  divider: 'divider',
  footer: 'footer',
  header: 'header',
  image: 'image',
  label: 'label',
  list: 'list',
  listItem: 'listItem',
  plugin: 'plugin',
  popUp: 'popup',
  select: 'select',
  textField: 'textField',
  video: 'video',
  view: 'view',
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
