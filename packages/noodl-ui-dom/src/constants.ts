import {
  dataAttributes as noodluiDataAttributes,
  nuiEmitTransaction,
} from 'noodl-ui'

export const classes = {
  ECOS_DOC: 'ecosdoc',
  ECOS_DOC_IMAGE: 'ecosdoc-image',
  ECOS_DOC_PDF: 'ecosdoc-pdf',
  ECOS_DOC_TEXT: 'ecosdoc-text',
  ECOS_DOC_TEXT_TITLE: 'ecosdoc-text-title',
  ECOS_DOC_TEXT_BODY: 'ecosdoc-text-body',
  ECOS_DOC_NOTE: 'ecosdoc-note',
  ECOS_DOC_NOTE_DATA: 'ecosdoc-note-data',
  GLOBAL: 'global',
  PAGE: 'page',
  PLUGIN_HEAD: 'pluginHead',
  PLUGIN_BODY_TOP: 'pluginBodyTop',
  PLUGIN_BODY_TAIL: 'pluginBodyTail',
  POPUP: 'popup',
  POPUP_GLOBAL: 'popup-global',
  SCROLL_VIEW: 'scroll-view',
  TEXT_BOARD: 'text-board',
} as const

export const dataAttributes = [
  ...noodluiDataAttributes,
  'data-globalid',
] as const

export const eventId = {
  page: {
    /** Sorted by order of occurrence */
    on: {
      ON_STATUS_CHANGE: 'on:status.change',
      ON_NAVIGATE_START: 'on:navigate.start',
      ON_NAVIGATE_ABORT: 'on:navigate.abort',
      ON_OUTBOUND_REDIRECT: 'on:outbound.redirect',
      ON_DOM_CLEANUP: 'on:dom.cleanup',
      ON_BEFORE_RENDER_COMPONENTS: 'on:before.render.components',
      ON_APPEND_NODE: 'on:append.node',
      ON_BEFORE_CLEAR_ROOT_NODE: 'on:before.clear.root.node',
      ON_BEFORE_APPEND_CHILD: 'on:before.append.child',
      ON_AFTER_APPEND_CHILD: 'on:after.append.child',
      ON_REDRAW_BEFORE_CLEANUP: 'on:redraw.before.cleanup',
      ON_COMPONENTS_RENDERED: 'on:components.rendered',
      ON_NAVIGATE_ERROR: 'on:navigate.error',
      ON_MODAL_STATE_CHANGE: 'on:modal.state.change',
    },
    /** Sorted by order of occurrence */
    status: {
      ANY: 'status:any',
      IDLE: 'status:idle',
      NAVIGATING: 'status:navigating',
      NAVIGATE_ERROR: 'status:navigate.error',
      SNAPSHOT_RECEIVED: 'status:snapshot.received',
      RESOLVING_COMPONENTS: 'status:resolving.components',
      COMPONENTS_RECEIVED: 'status:components.resolved',
      RENDERING_COMPONENTS: 'status:rendering.components',
      COMPONENTS_RENDERED: 'status:components.rendered',
    },
  },
} as const

export const transaction = {
  ...nuiEmitTransaction,
  CREATE_ELEMENT: 'CREATE_ELEMENT',
} as const

export const CREATE_GLOBAL_ID = 'CREATE_GLOBAL_ID'
