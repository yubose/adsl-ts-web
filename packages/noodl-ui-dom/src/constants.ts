/** NOODL DOM Parser event names */
export const noodlDomParserEvents = {
  onCreateNode: 'on.create.node',
} as const

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
