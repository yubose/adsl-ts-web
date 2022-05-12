export const _symbol = {
  diagnostic: Symbol('DIAGNOSTIC'),
  root: Symbol('ROOT'),
} as const

/* -------------------------------------------------------
  ---- STYLES
-------------------------------------------------------- */
export const xKeys = <const>['width', 'left']
export const yKeys = <const>['height', 'top', 'marginTop']
export const posKeys = <const>[...xKeys, ...yKeys]

// Style keys that map their values relative to the viewport's height
export const vpHeightKeys = <const>[
  ...yKeys,
  'borderRadius',
  'fontSize',
  'paddingTop',
  'paddingBottom',
  'marginBottom',
]

export const vpWidthKeys = <const>[
  ...xKeys,
  'marginLeft',
  'marginRight',
  'paddingLeft',
  'paddingRight',
]

export const textAlignStrings = [
  'left',
  'center',
  'right',
  'centerX',
  'centerY',
] as const

export enum ReferenceType {
  AWAIT = 0,
  ROOT_MERGE = 1,
  LOCAL_MERGE = 2,
  EVAL_ROOT_MERGE = 3,
  EVAL_LOCAL_MERGE = 4,
  EVAL_BUILT_IN = 5,
  TILDE = 6,
  TRAVERSE = 7,
}

export enum ValidatorType {
  ERROR = 9000,
  WARN = 9001,
  INFO = 9002,
}

export enum DiagnosticCode {
  LOCAL_REF_MISSING_ROOT_KEY = 20000,
  ROOT_REF_MISSING_ROOT_KEY = 20001,
  ROOT_MISSING_ROOT_KEY = 20002,
  ROOT_VALUE_EMPTY = 20003,
  REF_ = 30000,
}
