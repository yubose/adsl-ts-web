import {
  actionTypes as noodlTypesActionTypes,
  componentTypes as noodlComponentTypes,
  userEvent,
} from 'noodl-types'
import type { NUIActionType } from './types'

// Extended constants from this lib
export const lib = {
  actionTypes: ['anonymous', 'emit', 'goto', 'toast'],
  components: ['br'],
  emitTriggers: [
    'dataKey',
    'dataValue',
    'path',
    'placeholder',
    'postMessage',
    'register',
  ],
  dataAttributes: [
    'data-key',
    'data-listid',
    'data-name',
    'data-globalid',
    'data-options',
    'data-placeholder',
    'data-src',
    'data-value',
    'data-viewtag',
    'data-ux',
  ],
} as const

export const actionTypes = [...noodlTypesActionTypes, ...lib.actionTypes]
export const componentTypes = [...noodlComponentTypes, ...lib.components]

export const triggers = [
  ...lib.emitTriggers,
  ...userEvent,
  'onInput',
  'postMessage',
]

export const cache = {
  page: {
    hooks: {
      PAGE_CREATED: 'PAGE_CREATED',
      PAGE_REMOVED: 'PAGE_REMOVED',
      PAGE_UPDATED: 'PAGE_UPDATED',
    },
  },
} as const

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
  component: {
    list: {
      ADD_DATA_OBJECT: 'ADD_DATA_OBJECT',
      DELETE_DATA_OBJECT: 'DELETE_DATA_OBJECT',
    },
    page: {
      PAGE_CREATED: 'PAGE_CREATED',
      PAGE_CHANGED: 'PAGE_CHANGED',
      PAGE_COMPONENTS: 'PAGE_COMPONENTS',
    },
    textField: {
      placeholder: 'PLACEHOLDER',
    },
  },
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
  POST_MESSAGE: 'postMessage',
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
