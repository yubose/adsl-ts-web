import {
  dataAttributes as noodluiDataAttributes,
  trigger as nuiTrigger,
} from 'noodl-ui'

export const ARIA_LABELLEDBY = 'aria-labelledby'
export const ARIA_HIDDEN = 'aria-hidden'
export const ARIA_LABEL = 'aria-label'
export const BASE_PAGE_URL = 'index.html?'
export const CONTENT_SECURITY_POLICY = 'Content-Security-Policy'
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
export const CREATE_GLOBAL_ID = 'CREATE_GLOBAL_ID'
export const DATA_KEY = 'data-key'
export const DATA_VALUE = 'data-value'
export const DATA_NAME = 'data-name'
export const DATA_SRC = 'data-src'
export const DATA_GLOBALID = 'data-globalid'
export const DATA_LISTID = 'data-listid'
export const DATA_OPTIONS = 'data-options'
export const DATA_PLACEHOLDER = 'data-placeholder'
export const DATA_VIEWTAG = 'data-viewtag'
export const DATA_UX = 'data-ux'

export const dataAttributes = [
  ...noodluiDataAttributes,
  'data-globalid',
] as const

export const eventId = {
  componentPage: {
    on: {
      ON_LOAD: 'ON_LOAD',
      ON_ERROR: 'ON_ERROR',
    },
  },
  page: {
    /** Sorted by order of occurrence */
    on: {
      ON_ASPECT_RATIO_MIN: 'ON_ASPECT_RATIO_MIN',
      ON_ASPECT_RATIO_MAX: 'ON_ASPECT_RATIO_MAX',
      ON_STATUS_CHANGE: 'ON_STATUS_CHANGE',
      ON_NAVIGATE_START: 'ON_NAVIGATE_START',
      ON_NAVIGATE_STALE: 'ON_NAVIGATE_STALE',
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

export const trigger = { ...nuiTrigger, POST_MESSAGE: 'postMessage' } as const
export const triggers = Object.values(trigger)
