/** NOODL DOM Parser event names */
// export const noodlDomParserEvents = {
//   onCreateNode: 'on.create.node',
// } as const

// const createButtonEvent = 'create.button' as const
// const createDividerEvent = 'create.divider' as const
// const createFooterEvent = 'create.footer' as const
// const createHeaderEvent = 'create.header' as const
// const createImageEvent = 'create.image' as const
// const createLabelEvent = 'create.label' as const
// const createListEvent = 'create.list' as const
// const createListItemEvent = 'create.list.item' as const
// const createPopUpEvent = 'create.popup' as const
// const createSelectEvent = 'create.select' as const
// const createTextFieldEvent = 'create.textfield' as const
// const createVideoEvent = 'create.video' as const
// const createViewEvent = 'create.view' as const

export const componentEventMap = {
  button: 'create.button',
  divider: 'create.divider',
  footer: 'create.footer',
  header: 'create.header',
  image: 'create.image',
  label: 'create.label',
  list: 'create.list',
  listItem: 'create.list.item',
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

/** Page render statuses */
// export const renderStatus = {
//   idle: '',
//   initiating: 'initiating',
//   initializingRootNode: 'initializing.root.node',
//   initializedRootNode: 'initialized.root.node',
//   initializeRootNodeFailed: 'initialize.root.node.failed',
//   renderingComponents: 'rendering.components',
//   renderedComponents: 'rendered.components',
//   renderComponentsFailed: 'render.components.failed',
//   cached: 'cached',
//   receivedSnapshot: 'received.snapshot',
//   rendered: 'rendered',
// } as const
