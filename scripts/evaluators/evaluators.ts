// @ts-nocheck
import _ from 'lodash'
import { Pair, YAMLMap, YAMLSeq } from 'yaml/types'
import { StyleTextAlign } from '../../../src/types'
import { isString } from '../../../src/utils/common'
import { availableComponentTypes } from '../../../src/resolvers/getElementType'
import {
  knownTextAlignStrings,
  knownXYStrings,
} from '../../../src/resolvers/getAlignAttrs'
import isReference from '../../../src/utils/isReference'
import identifyScalar, { NOODLScalarIdentifiers } from '../utils/identifyScalar'
import identifyPair, { NOODLPairIdentities } from '../utils/identifyPair'
import identifyMap, { NOODLMapIdentities } from '../utils/identifyMap'
import identifySeq, { NOODLSeqIdentities } from '../utils/identifySeq'

export interface PushInvalidation {
  (reason: string, ...args: any[]): any
}

export interface Evaluate {
  (node: unknown, push: PushInvalidation, options?: any)
}

export type EvaluatePair = Record<
  | NOODLScalarIdentifiers
  | NOODLPairIdentities
  | NOODLMapIdentities
  | NOODLSeqIdentities,
  Evaluate
>

const evaluators = new Map()

const _create = function (
  name: string,
  options:
    | Evaluate
    | {
        keyword?: {
          keywords: string | string[]
          evaluate: (keyword: string, ...args: Parameters<Evaluate>) => void
        }
      },
) {
  evaluators[name] = (...args: Parameters<Evaluate>) => {
    if (options.keyword) {
      let keywords = options.keyword.keywords

      if (!_.isArray(keywords)) {
        keywords = [keywords]
      }

      keywords.forEach((keyword) => {
        options.keyword.evaluate(keyword, ...args)
      })
    } else {
      //
    }
  }
}

evaluators.actionChain = function (pair: Pair, push) {
  if (identifyPair.actionChain(pair)) {
    let actionChain = pair.value

    if (actionChain instanceof YAMLSeq) {
      for (let index = 0; index < actionChain.items.length; index++) {
        const action = actionChain.items[index]

        if (action instanceof YAMLMap) {
          if (identifyMap.actionObject(action)) {
            return true
          }
        } else if (_.isPlainObject(action)) {
          if ('actionType' in action) {
            return true
          }
        }
      }
    } else if (Array.isArray(actionChain)) {
      for (let index = 0; index < actionChain.length; index++) {
        const action = actionChain[index]

        if (_.isPlainObject(action)) {
          if ('actionType' in action) {
            return true
          }
        }
      }
    }
  }

  return false
}

evaluators.actionObject = function (action: any, push) {
  //
}

_create('eventHandlers', {
  keyword: {
    keywords: ['onClick', 'onHover'],
    evaluate: (keyword, pair, push) => {
      const seq = pair.value
      if (seq instanceof YAMLSeq) {
        const actions = seq.items
        actions.forEach((action) => {
          evaluators.actionObject(action, push)
        })
      } else if (_.isArray(seq)) {
        _.forEach(seq, (action) => {
          evaluators.actionObject(action, push)
        })
      }
    },
  },
})

// ACTIONS CHAIN
evaluators.set('actionType', (value, { context, invalidate }) => {
  if (value === 'builtIn') {
    if (!('funcName' in context)) {
      invalidate('Missing "funcName" property for the "builtIn" context')
    }
  } else if (value === 'ecosConnection') {
    if (!('dataModel' in context)) {
      invalidate(
        `Missing "dataModel" property for the "ecosConnection" context`,
      )
    }
  } else if (value === 'pageJump') {
    if (!('destination' in context)) {
      invalidate(`Missing "destination" property for the "pageJump" context`)
    }
  } else if (value === 'updateObject') {
    if (!('object' in context)) {
      invalidate(`Missing "object" property for the "updateObject" context`)
    }
  } else {
    invalidate(`Unknown value: "${value}". Perhaps it is new?`)
  }

  return resolveContext(context, ['children', 'components', 'style'])
})

// COMPONENT TYPES
evaluators.set('type', (value, { context, invalidate }) => {
  if (
    'style' in context ||
    'components' in context ||
    'children' in context ||
    'text' in context
  ) {
    if (!availableComponentTypes.includes(value)) {
      // Check if this is just a root level eCOS object since they also have "type" properties
      invalidate(
        `The component type "${value}" was not matched with existing ones. Perhaps it is new?`,
      )
    } else {
      if (value === 'textField') {
        if (!('contentType' in context)) {
          invalidate(
            `Encountered a textField with no "contentType" property. contentType should be set to distinguish between email textfields, phone, etc.`,
          )
        }
        if (!('required' in context)) {
        }
      } else if (value === 'select') {
        if (!('options' in context)) {
          invalidate(`This select field is missing an "options" property.`)
        }
      } else if (!isString(value)) {
        invalidate(`The component type ${value} is not valid`)
      }
    }
  }

  return resolveContext(context, ['children', 'components', 'style'])
})

// CONTENT TYPES
evaluators.set('contentType', (value, { context, invalidate }) => {
  if (getInputType(value) === null) {
    invalidate(
      `The content type "${value}" was not matched with current implementations. Perhaps it is new?`,
    )
    return resolveContext(context, ['children', 'components', 'style'])
  }
})

// EVENTS (ex: onClick, onHover, etc)
evaluators.set('onClick', (value, { context, invalidate }) => {
  if (!Array.isArray(value)) {
    if (isString(value)) {
      invalidate(
        `"${value}" is a string and not an action chain. This is deprecated`,
      )
    } else {
      invalidate(`"${value}" is not an array (action chain)`)
    }
  }
  return resolveContext(context, ['children', 'components', 'style'])
})

/* -------------------------------------------------------
  ---- STYLE EVALUATORS
-------------------------------------------------------- */

//  BORDER STYLE
evaluators.set('border', (value, { context, invalidate }) => {
  const borderStylePresets = ['0', '1', '2', '3', '4', '5', '6', '7']
  const borderStyle = value?.style
  if (isString(borderStyle)) {
    if (!borderStylePresets.includes(borderStyle)) {
      invalidate(
        `Invalid border style pre Available options are: ${borderStylePresets}`,
      )
    }
  } else {
    invalidate(
      `The value of style.border is not a string. Available values are: ${borderStylePresets}`,
    )
  }

  return resolveContext(context, ['children', 'components'])
})

evaluators.set(
  'textAlign',
  (value: StyleTextAlign, { context, invalidate }) => {
    if (isString(value)) {
      if (!knownTextAlignStrings.includes(value)) {
        invalidate(
          `Unknown textAlign string: ${value}. Known string values are: ${knownTextAlignStrings}`,
        )
      }
    } else if (isObject(value)) {
      const keys = Object.keys(value)

      for (let index = 0; index < keys.length; index++) {
        const key = keys[index]
        if (!['x', 'y'].includes(key)) {
          invalidate(
            `Unknown textAlign property: ${key}. Valid properties are "x" or "y"`,
          )
        } else {
          if (isString(value[key])) {
            if (!knownTextAlignStrings.includes(value[key])) {
              invalidate(
                `Unknown value for textAlign.${key}: ${value[key]} (Expected one of these: ${knownXYStrings})`,
              )
            }
          } else {
            invalidate(
              `Unknown data type for textAlign.${key}: ${value[key]} (This should be a string)`,
            )
          }
        }
      }
    }
  },
)

/* -------------------------------------------------------
  ---- REFERENCING
-------------------------------------------------------- */

// DATA KEY
evaluators.set('dataKey', (value, { invalidate }) => {
  if (isReference(value)) {
    invalidate(
      `dataKeys should not be referenced with symbols. It is a direct link by dot delimite paths`,
    )
  }
  // TODO: Check if this dataKey can actually grab its value
})

// REGEX REFERENCE SYMBOLS
// evaluators.set(/^./, (value, { context, invalidatet, parser }) => {
//   if (isReference(keyword) || keyword === 'dataKey') {
//     let result
//     if (isGlobalDotReference(keyword)) {
//       result = parser.get(keyword)
//       if (!result) {
//         invalidate(
//           `Could not perform a global inheritance for key "${keyword}"`,
//         )
//       }
//     } else if (isLocalDotReference(keyword)) {
//       result = parser.get(keyword)
//       if (!result) {
//         invalidate(
//           `Could not perform a global inheritance for key "${keyword}"`,
//         )
//       }
//     } else if (isEvaluateReference(keyword)) {
//       result = parser.get(keyword)
//       if (!result) {
//         invalidate(
//           `Could not perform a global inheritance for key "${keyword}"`,
//         )
//       }
//     } else if (isAtStartInheritReference(keyword)) {
//       result = parser.get(keyword)
//       if (!result) {
//         invalidate(`Could not perform an @ inheritance for key "${keyword}"`)
//       }
//     }
//   }
// })
