export const actionTypes = [
  'anonymous', // lib
  'builtIn',
  'emit', // lib
  'evalObject',
  'goto', // lib
  'pageJump',
  'popUp',
  'popUpDismiss',
  'refresh',
  'saveObject',
  'toast',
  'updateObject',
] as const

export const actionChainEmitTriggers = [
  'onBlur',
  'onClick',
  'onChange',
  'toast',
] as const

export const resolveEmitTriggers = [
  'dataKey',
  'dataValue',
  'path',
  'placeholder',
  'register',
] as const

export const emitTriggers = [
  ...actionChainEmitTriggers,
  ...resolveEmitTriggers,
] as const

export const componentTypes = [
  'button',
  'date',
  'divider',
  'footer',
  'header',
  'image',
  'label',
  'list',
  'listItem',
  'page',
  'plugin',
  'pluginHead',
  'pluginBodyTop',
  'pluginBodyTail',
  'popUp',
  'register',
  'searchBar',
  'select',
  'scrollView',
  'textField',
  'textView',
  'video',
  'view',
] as const

export const contentTypes = [
  'countryCode',
  'email',
  'formattedDate',
  'formattedDuration',
  'listObject',
  'number',
  'password',
  'passwordHidden',
  'phoneNumber',
  'phone',
  'tel',
  'text',
  'timer',
  'videoSubStream',
  'vidoeSubStream',
] as const

export const eventTypes = [
  'onBlur',
  'onClick',
  'onChange',
  'onHover',
  'onMouseEnter',
  'onMouseLeave',
  'onMouseOut',
  'onMouseOver',
] as const

export const customComponentTypes = [
  'br', // Created customly in components with a textBoard implementation
] as const

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
    list: {
      ADD_DATA_OBJECT: 'add.data.object',
      DELETE_DATA_OBJECT: 'delete.data.object',
      RETRIEVE_DATA_OBJECT: 'retrieve.data.object',
      UPDATE_DATA_OBJECT: 'update.data.object',
      CREATE_LIST_ITEM: 'create.list.item',
      REMOVE_LIST_ITEM: 'remove.list.item',
      RETRIEVE_LIST_ITEM: 'retrieve.list.item',
      UPDATE_LIST_ITEM: 'update.list.item',
    },
    listItem: {
      REDRAW: 'redraw',
      REDRAWED: 'redrawed',
    },
    page: {
      RETRIEVE_COMPONENTS: 'component:page:retrieve.components',
      COMPONENTS_RECEIVED: 'component:page:components.received',
      MISSING_COMPONENTS: 'component:page:missing.components',
      RESOLVED_COMPONENTS: 'component:page:resolved.components',
      SET_REF: 'component:page:set.ref',
    },
    register: {
      ONEVENT: 'onEvent',
    },
  },
  SET_PAGE: 'set.page',
  NEW_PAGE: 'new.page',
  NEW_PAGE_REF: 'new.page.ref',
} as const

/** { textAlign: '' } */
export const textAlignStrings = [
  'left',
  'center',
  'right',
  'centerX',
  'centerY',
]

/** { textAlign: { x, y } } */
export const textAlignXYStrings = ['left', 'center', 'right']

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
