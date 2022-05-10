export const _symbol = {
  diagnostic: Symbol('DIAGNOSTIC'),
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
