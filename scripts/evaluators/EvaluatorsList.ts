import isPlainObject from 'lodash/isPlainObject'
import yaml, { Document, Options } from 'yaml'
import makeEvaluator from './makeEvaluator'

class EvaluatorsList {
  private _root: Record<string, any>
  private _evaluators: ReturnType<typeof makeEvaluator>[]
  private _objects: { [key: string]: Document }

  load(name: string, yml, parseOptions: Options) {
    this._objects[name] = yaml.parseDocument(yml, parseOptions)
    return this
  }

  addEvaluator(evaluator: ReturnType<typeof makeEvaluator>) {
    if (!this._evaluators) this._evaluators = []
    this._evaluators.push(evaluator)
    return this
  }

  addRoot(key: string | Object, value?: any) {
    if (key !== undefined) {
      if (!this._root) this._root = {}
    }
    if (typeof key === 'string' && typeof value === 'string') {
      this._root[key] = value
    } else if (typeof key !== 'string' && isPlainObject(key)) {
      Object.entries(key).forEach(([key, value]) => {
        this._root[key] = value
      })
    }
    return this
  }

  getRoot(key?: string) {
    if (typeof key === 'string') {
      return this._root[key]
    }
    return this._root
  }

  getResults() {
    return this._evaluators.map((evaluator) => {
      return evaluator.getResults()
    })
  }

  has(evaluator: ReturnType<typeof makeEvaluator>) {
    for (let index = 0; index < this._evaluators.length; index++) {
      const currentEvaluator = this._evaluators[index]
      if (currentEvaluator.getId() === evaluator.getId()) {
        return true
      }
    }
    return false
  }

  run(value: any, context?: { name?: string }) {
    this._evaluators.forEach((evaluator) => {
      if (isPlainObject(context)) {
        Object.keys(context).forEach((key) => {
          if (!evaluator.hasContext(key)) {
            evaluator.addContext(key, context[key])
          }
        })
      }
      evaluator.run(value)
    })
  }
}

export default EvaluatorsList
