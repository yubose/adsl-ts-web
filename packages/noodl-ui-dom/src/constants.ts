import {
  dataAttributes as noodluiDataAttributes,
  nuiEmitTransaction,
} from 'noodl-ui'

export const BASE_PAGE_URL = 'index.html?'
export const classes = {
  ECOS_DOC: 'ecosdoc',
  ECOS_DOC_IMAGE: 'ecosdoc-image',
  ECOS_DOC_PDF: 'ecosdoc-pdf',
  ECOS_DOC_TEXT: 'ecosdoc-text',
  ECOS_DOC_TEXT_TITLE: 'ecosdoc-text-title',
  ECOS_DOC_TEXT_BODY: 'ecosdoc-text-body',
  ECOS_DOC_TEXT_PLAIN: 'ecosdoc-textplain',
  ECOS_DOC_TEXT_MARKDOWN: 'ecosdoc-textmarkdown',
  ECOS_DOC_TEXT_CSS: 'ecosdoc-textcss',
  ECOS_DOC_TEXT_HTML: 'ecosdoc-texthtml',
  ECOS_DOC_TEXT_JAVASCRIPT: 'ecosdoc-textjs',
  ECOS_DOC_NOTE: 'ecosdoc-note',
  ECOS_DOC_NOTE_TITLE: 'ecosdoc-note-title',
  ECOS_DOC_NOTE_DATA: 'ecosdoc-note-data',
  ECOS_DOC_VIDEO: 'ecosdoc-video',
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
      ON_ASPECT_RATIO_MIN: 'ON_ASPECT_RATIO_MIN',
      ON_ASPECT_RATIO_MAX: 'ON_ASPECT_RATIO_MAX',
      ON_STATUS_CHANGE: 'ON_STATUS_CHANGE',
      ON_NAVIGATE_START: 'ON_NAVIGATE_START',
      ON_NAVIGATE_ABORT: 'ON_NAVIGATE_ABORT',
      ON_OUTBOUND_REDIRECT: 'ON_OUTBOUND_REDIRECT',
      ON_DOM_CLEANUP: 'ON_DOM_CLEANUP',
      ON_BEFORE_RENDER_COMPONENTS: 'ON_BEFORE_RENDER_COMPONENTS',
      ON_APPEND_NODE: 'ON_APPEND_NODE',
      ON_BEFORE_CLEAR_ROOT_NODE: 'ON_BEFORE_CLEAR_ROOT_NODE',
      ON_REDRAW_BEFORE_CLEANUP: 'ON_REDRAW_BEFORE_CLEANUP',
      ON_COMPONENTS_RENDERED: 'ON_COMPONENTS_RENDERED',
      ON_NAVIGATE_ERROR: 'ON_NAVIGATE_ERROR',
    },
    /** Sorted by order of occurrence */
    status: {
      ANY: 'ANY',
      IDLE: 'IDLE',
      NAVIGATING: 'NAVIGATING',
      NAVIGATE_ERROR: 'NAVIGATE_ERROR',
      SNAPSHOT_RECEIVED: 'SNAPSHOT_RECEIVED',
      RESOLVING_COMPONENTS: 'RESOLVING_COMPONENTS',
      COMPONENTS_RECEIVED: 'COMPONENTS_RECEIVED',
      RENDERING_COMPONENTS: 'RENDERING_COMPONENTS',
      COMPONENTS_RENDERED: 'COMPONENTS_RENDERED',
    },
  },
} as const

export const transaction = {
  ...nuiEmitTransaction,
  CREATE_ELEMENT: 'CREATE_ELEMENT',
} as const

export const CREATE_GLOBAL_ID = 'CREATE_GLOBAL_ID'
