import _ from 'lodash'

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
  'updateObject',
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
  'plugin',
  'popUp',
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
  'videoSubStream',
  'vidoeSubStream',
] as const

export const eventTypes = [
  'onClick',
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
    EVALOBJECT: 'evalObject',
    GOTO: 'goto',
    UPDATEOBJECT: 'updateObject',
    REFRESH: 'refresh',
    SAVEOBJECT: 'saveObject',
    POPUP: 'popUp',
    POPUPDISMISS: 'popUpDismiss',
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
  },
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
