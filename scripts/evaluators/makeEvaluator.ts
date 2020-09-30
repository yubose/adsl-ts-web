import _ from 'lodash'

export type ExpectedType =
  | 'array'
  | 'boolean'
  | 'object'
  | 'string'
  | 'function'

export interface EvaluatorOptions {
  expectedType?: ExpectedType | ExpectedType[]
}

export interface Evaluator<T = any> {
  (value: T, options: EvaluatorOptions & { push: (msg: string) => string }): any
}

const makeEvaluator = function (
  evaluate: Evaluator,
  options?: EvaluatorOptions,
) {
  let _id = _.uniqueId()
  let _results: { reason: string; value: any }[] = []
  let _context: { [key: string]: any } = {}

  return {
    addContext(context: string | { [key: string]: any }, options?: string) {
      if (_.isPlainObject(context)) {
        Object.entries(context).forEach(([key, value]) => {
          _context[key] = value
        })
      } else {
        if (_.isString(context) && _.isString(options)) {
          const key = context
          const value = options
          _context[key] = value
        }
      }
    },
    getId() {
      return _id
    },
    getResults(pickKeys?: string | string[]) {
      let context

      if (_.isString(pickKeys) || Array.isArray(pickKeys)) {
        context = _.omit(_context, pickKeys)
      }

      return {
        context: context || _context,
        results: _results,
      }
    },
    hasContext(key: string) {
      return key in _context
    },
    push(reason: any, value: any) {
      _results.push({ reason, value })

      if (options?.expectedType) {
        this._pushTypeValidations(value, options.expectedType)
      }
    },
    run(value: any) {
      evaluate(value, {
        ..._context,
        push: (msg: string) => this.push(msg, value),
      })
    },
    _pushTypeValidations(
      value: any,
      expectedType: ExpectedType | ExpectedType[],
    ) {
      const expectedTypes: string[] = _.isString(expectedType)
        ? [expectedType]
        : expectedType

      const result = typeof value

      if (!expectedTypes.includes(result)) {
        _results.push({
          reason: `This value was not received in the expected data type of ${result}. Expected one of these types: ${expectedTypes}`,
          value,
        })
      }
    },
  }
}

export default makeEvaluator
