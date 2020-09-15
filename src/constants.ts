export const modalIds = {
  VERIFICATON_CODE: 'VERIFICATON_CODE',
} as const

export const CACHED_PAGES = 'CACHED_PAGES'

/** Page render statuses */
export const renderStatus = {
  idle: '',
  initiating: 'initiating',
  initializingRootNode: 'initializing.root.node',
  initializedRootNode: 'initialized.root.node',
  initializeRootNodeFailed: 'initialize.root.node.failed',
  renderingComponents: 'rendering.components',
  renderedComponents: 'rendered.components',
  renderComponentsFailed: 'render.components.failed',
  cached: 'cached',
  receivedSnapshot: 'received.snapshot',
  rendered: 'rendered',
} as const

/** NOODL DOM Parser event names */
export const noodlDomParserEvents = {
  onCreateNode: 'on.create.node',
} as const
