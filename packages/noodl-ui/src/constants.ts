import { actionTypes as noodlTypesActionTypes, userEvent } from 'noodl-types'
import type { NUIActionType } from './types'

// Extended constants from this lib
export const lib = {
  actionTypes: ['anonymous', 'emit', 'goto', 'toast'],
  components: ['br'],
  emitTriggers: ['dataKey', 'dataValue', 'path', 'placeholder', 'register'],
  dataAttributes: [
    'data-key',
    'data-listid',
    'data-name',
    'data-options',
    'data-placeholder',
    'data-src',
    'data-value',
    'data-viewtag',
    'data-ux',
  ],
} as const

export const actionTypes = [...noodlTypesActionTypes, ...lib.actionTypes]

export const triggers = [...lib.emitTriggers, ...userEvent, 'onInput']

export const groupedActionTypes = actionTypes.filter(
  (t) => !/(builtIn|emit|register)/i.test(t),
) as Exclude<NUIActionType, 'builtIn' | 'emit' | 'register'>[]

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

export const nuiEvent = {
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
  NEW_PAGE: 'new-page',
  NEW_PAGE_REF: 'new-page-ref',
} as const

export const nuiEmitType = {
  REGISTER: 'register',
  TRANSACTION: 'transaction',
} as const

export const nuiEmitTransaction = {
  REQUEST_PAGE_OBJECT: 'REQUEST_PAGE_OBJECT',
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
