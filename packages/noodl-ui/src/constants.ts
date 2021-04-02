import { actionTypes as noodlTypesActionTypes, userEvent } from 'noodl-types'

// Extended constants from this lib
export const lib = {
  actionTypes: ['anonymous', 'emit', 'goto', 'toast'],
  components: ['br'],
  emitTriggers: ['dataKey', 'dataValue', 'path', 'placeholder', 'register'],
  dataAttributes: [
    'data-key',
    'data-listid',
    'data-name',
    'data-placeholder',
    'data-src',
    'data-value',
    'data-viewtag',
    'data-ux',
  ],
} as const

export const actionTypes = [...noodlTypesActionTypes, ...lib.actionTypes]
export const triggers = [...lib.emitTriggers, ...userEvent]

export const presets = {
  border: {
    '1': { borderStyle: 'none', borderRadius: '0px' },
    '2': {
      borderRadius: '0px',
      borderStyle: 'none',
      borderBottomStyle: 'solid',
    },
    '3': { borderStyle: 'solid' },
    '4': { borderStyle: 'dashed', borderRadius: '0px' },
    '5': { borderStyle: 'none' },
    '6': { borderStyle: 'solid', borderRadius: '0px' },
    '7': { borderBottomStyle: 'solid', borderRadius: '0px' },
  },
}

export const event = {
  action: {
    PAGEJUMP: 'pageJump',
    BUILTIN: 'builtIn',
    EMIT: 'emit',
    EVALOBJECT: 'evalObject',
    GOTO: 'goto',
    UPDATEOBJECT: 'updateObject',
    REFRESH: 'refresh',
    SAVEOBJECT: 'saveObject',
    POPUP: 'popUp',
    POPUPDISMISS: 'popUpDismiss',
    TOAST: 'toast',
  },
  actionChain: {
    ON_BEFORE_RESOLVE: 'beforeResolve',
    ON_BEFORE_RESOLVE_STYLES: 'beforeResolveStyles',
    ON_CHAIN_START: 'chainStart',
    ON_CHAIN_ABORTED: 'chainAborted',
    ON_OVERRIDE_DATA_VALUE: 'overrideDataValue',
    ON_BUILTIN_MISSING: 'builtinMissing',
    ON_CHAIN_END: 'chainEnd',
    ON_CHAIN_ERROR: 'chainError',
    ON_AFTER_RESOLVE: 'afterResolve',
  },
  component: {
    image: {
      PATH: 'path',
    },
    list: {
      ADD_DATA_OBJECT: 'add-data-object',
      DELETE_DATA_OBJECT: 'delete-data-object',
      RETRIEVE_DATA_OBJECT: 'retrieve-data-object',
      UPDATE_DATA_OBJECT: 'update-data-object',
    },
    listItem: {
      REDRAW: 'redraw',
      REDRAWED: 'redrawed',
    },
    page: {
      PAGE_INSTANCE_CREATED: 'page-instance-created',
      PAGE_OBJECT: 'page-object',
      PAGE_COMPONENTS: 'page-components',
      RETRIEVE_COMPONENTS: 'retrieve-components',
      COMPONENTS_RECEIVED: 'components-received',
      MISSING_COMPONENTS: 'missing-components',
      RESOLVED_COMPONENTS: 'resolved-components',
      SET_REF: 'set-ref',
    },
    register: {
      ONEVENT: 'onEvent',
    },
    textField: {
      placeholder: 'PLACEHOLDER',
    },
  },

  SET_PAGE: 'set-page',
  NEW_PAGE: 'new-page',
  NEW_PAGE_REF: 'new-page-ref',
} as const

export const nuiEmitType = {
  REGISTER: 'register',
  TRANSACTION: 'transaction',
} as const

export const nuiEmitTransaction = {
  REQUEST_PAGE_OBJECT: 'register-page-object',
} as const

export const trigger = {
  DATA_KEY: 'dataKey',
  DATA_VALUE: 'dataValue',
  PATH: 'path',
  PLACEHOLDER: 'placeholder',
  REGISTER: 'register',
  ON_BLUR: 'onBlur',
  ON_CLICK: 'onClick',
  ON_CHANGE: 'onChange',
  ON_HOVER: 'onHover',
  ON_MOUSEENTER: 'onMouseEnter',
  ON_MOUSELEAVE: 'onMouseLeave',
  ON_MOUSEOUT: 'onMouseOut',
  ON_MOUSEOVER: 'onMouseOver',
} as const

/* -------------------------------------------------------
  ---- LIB CONSTANTS
-------------------------------------------------------- */
export const consumer = {
  types: {
    MORPH: 'morph',
    RENAME: 'rename',
    REMOVE: 'remove',
    REPLACE: 'replace',
  },
  ids: {
    COLOR_HEX: 'style.color.hex',
    DISPLAY: 'style.display',
    FONT_FAMILY: 'style.fontFamily',
    HEADER: 'header',
    LIST: 'list',
    LISTITEM: 'listItem',
    MORPH_ALIGN: 'morph.style.align',
    MORPH_AXIS: 'morph.style.axis',
    MORPH_BORDER: 'morph.style.border',
    MORPH_FONTSTYLE: 'morph.style.fontStyle',
    MORPH_ISHIDDEN: 'morph.style.isHidden',
    MORPH_TEXTCOLOR: 'morph.style.textColor',
    MORPH_TEXTALIGN: 'morph.style.textAlign',
    MORPH_PATH_RESOURCE: 'morph.path.resource',
    MORPH_PATH_RESOURCE_ASYNC: 'morph.path.resource.async',
    MORPH_SHADOW: 'morph.style.shadow',
    POPUP: 'popUp',
    REMOVE_IMAGE_WIDTH: 'remove.image.width',
    REMOVE_IMAGE_HEIGHT: 'remove.image.height',
    REPLACE_CONTROLS: 'replace.controls',
    REPLACE_CONTENTTYPE: 'replace.contentType',
    REPLACE_EVENT_HANDLER: 'replace.event.handler',
    REPLACE_FONTSIZE: 'replace.style.fontSize',
    REPLACE_OPTIONS: 'replace.options',
    REPLACE_POSITION: 'replace.style.position',
    REPLACE_POSTER: 'replace.poster',
    REPLACE_PLACEHOLDER: 'replace.placeholder',
    REPLACE_HEIGHT: 'replace.style.height',
    REPLACE_REQUIRED: 'replace.required',
    REPLACE_VIDEOFORMAT: 'replace.videoFormat',
    REPLACE_WIDTH: 'replace.style.width',
    REPLACE_ZINDEX: 'replace.style.zIndex',
    SETUP: 'setup',
    TEXTVIEW: 'textView',
    VIDEO: 'video',
  } as const,
} as const
