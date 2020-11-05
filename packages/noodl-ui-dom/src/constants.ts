export const componentEventMap = {
  all: 'create.component',
  button: 'create.button',
  br: 'create.breakline',
  divider: 'create.divider',
  footer: 'create.footer',
  header: 'create.header',
  image: 'create.image',
  label: 'create.label',
  list: 'create.list',
  listItem: 'create.list.item',
  plugin: 'create.plugin',
  popUp: 'create.popup',
  select: 'create.select',
  textField: 'create.textfield',
  video: 'create.video',
  view: 'create.view',
} as const

export const componentEventTypes = Object.keys(
  componentEventMap,
) as (keyof typeof componentEventMap)[]

export const componentEventIds = Object.values(
  componentEventMap,
) as typeof componentEventMap[typeof componentEventTypes[number]][]
