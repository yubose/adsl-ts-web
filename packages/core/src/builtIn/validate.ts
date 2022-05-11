import type { StyleObject } from 'noodl-types'
import * as fp from '../utils/fp'
import * as is from '../utils/is'
import type { VisitFnArgs } from '../types'
import { ValidatorType } from '../constants'

export interface ValidatorConfig {
  /**
   * Validator function used to generate a specific message.
   * If the function returns false, the error message is generated.
   * If the function returns null, the info message is generated.
   */
  validate?: (args: VisitFnArgs) => {
    type?: ValidatorType
    message?: string | string[]
  }
}

function createValidator(config: ValidatorConfig) {
  return config
}

const validate = {
  reference: createValidator({
    validate: ({ key, node, pageName, root }) => {
      //
    },
  }),
}

export default validate
