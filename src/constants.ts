export const CACHED_PAGES = 'CACHED_PAGES'

export const modalIds = {
  VERIFICATON_CODE: 'VERIFICATON_CODE',
} as const

/** Ordered by occurrence */
export const pageEvent = {
  ON_NAVIGATE_START: 'on:navigate.start',
  ON_NAVIGATE_ABORT: 'on:navigate.abort',
  ON_OUTBOUND_REDIRECT: 'on:outbound.redirect',
  ON_BEFORE_RENDER_COMPONENTS: 'on:before.render.components',
  ON_COMPONENTS_RENDERED: 'on:components.rendered',
  ON_NAVIGATE_ERROR: 'on:navigate.error',
  ON_MODAL_STATE_CHANGE: 'on:modal.state.change',
} as const

/** Ordered by occurrence */
export const pageStatus = {
  IDLE: 'status:idle',
  NAVIGATING: 'status:navigating',
  NAVIGATE_ERROR: 'status:navigate.error',
  SNAPSHOT_RECEIVED: 'status:snapshot.received',
  RESOLVING_COMPONENTS: 'status:resolving.components',
  COMPONENTS_RESOLVED: 'status:components.resolved',
  RENDERING_COMPONENTS: 'status:rendering.components',
  COMPONENTS_RENDERED: 'status:components.rendered',
} as const
