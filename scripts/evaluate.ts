// @ts-nocheck
import path from 'path'
import chalk from 'chalk'
import fs from 'fs-extra'
import * as evaluators from './evaluators/evaluators'
import { logError } from '../../src/utils/common'
import getDirFilesAsJson from './utils/getDirFilesAsJson'
import * as log from './utils/log'

export interface EvaluatedResult<T = any> {
  pageName: string
  key: string
  value: any
  context: T
  reason: string[]
}

export interface EvaluatorOptions<T = any> {
  context: T
  invalidate: (
    reason: string | string[],
    nullifyKeys?: string | string[],
  ) => void
  parser: ReturnType<typeof makeRootsParser>
  root: any
}

export interface RunEvaluatorsCallbackOptions {
  key: string
  value: any
  properties: string[]
  evaluationType: 'keyword' | 'regex'
}

export interface StoredEvaluatorObject {
  evaluate: Evaluator
  expectedTypes?: ('array' | 'boolean' | 'object' | 'string' | 'function')[]
  omitKeys?: string[]
  root?: any // Optionally an overrider
}

export interface Evaluator<T = any> {
  (value: T, options: EvaluatorOptions): Partial<
    EvaluatorOptions['context']
  > | void
}

export class NOODLEvaluator {
  private _evaluators: {
    keywords: { [keyword: string]: Evaluator[] }
    regex: [RegExp, Evaluator][]
  } = { keywords: {}, regex: [] }
  private _root: any | undefined
  public parser: ReturnType<typeof makeRootsParser> | undefined
  public results: EvaluatedResult[] = []

  constructor({ root }: { root?: any } = {}) {
    if (root) {
      this.parser = makeRootsParser(root)
    }
  }

  add(
    trigger: string | RegExp,
    evaluate: Evaluator,
    options?: Omit<StoredEvaluatorObject, 'evaluate'>,
  ) {
    let keyword: string | undefined
    let regex: RegExp | undefined

    if (typeof trigger === 'string') {
      keyword = trigger
    } else if (trigger instanceof RegExp) {
      regex = trigger
    }

    if (keyword !== undefined) {
      if (!Array.isArray(this._evaluators['keywords'][keyword])) {
        this._evaluators.keywords[keyword] = []
      }
      this._evaluators.keywords[keyword].push(evaluate)
    } else if (regex) {
      this._evaluators.regex.push([regex, evaluate])
    }
  }

  clearResults() {
    this.results = []
  }

  evaluate<T = any>(
    obj: T,
    context: {
      pageName?: string
    } = {},
  ) {
    let pageName = context?.pageName || ''

    this._run(obj, (options) => {
      const { key, value, properties, evaluationType } = options

      const sharedOptions = {
        pageName,
        key,
        value,
        context: obj,
      }
      const evaluatorOptions = {} // TODO
      const invalidator = this._createInvalidate()
      const resolvedContext = this.evaluate(
        value,
        this._getEvaluatorOptions({
          ...sharedOptions,
          invalidate: invalidator.invalidate,
        }),
      )

      const results = invalidator.getResults()

      // Caller wants to modify the context output
      if (results.length) {
        this.results.push({
          ...sharedOptions,
          // @ts-ignore
          context: resolvedContext || obj,
          reason: results,
        })
      }
    })

    if (typeof obj === 'object') {
      // Check + invoke matching evaluators by regex
      // this._evaluators.regex.forEach(([regex, evaluate]) => {
      //   if (regex.test(key)) {
      //     const sharedOptions = {
      //       pageName: options.pageName || '',
      //       key,
      //       value,
      //       context: obj,
      //     }
      //     const invalidator = this._createInvalidate()
      //     evaluate(
      //       value,
      //       this._getEvaluatorOptions({
      //         ...sharedOptions,
      //         invalidate: invalidator.invalidate,
      //       }),
      //     )

      //     const results = invalidator.getResults()

      //     if (results.length) {
      //       this.results.push({
      //         reason: results,
      //         ...sharedOptions,
      //         context: options.resolveContext
      //           ? options.resolveContext(obj)
      //           : obj,
      //       })
      //     }
      //   }
      // })
      const value: any = {}
      const options: any = {}
      if (!Array.isArray(value)) {
        this.evaluate(value, options)
      } else {
        value.forEach((value) => this.evaluate(value, options))
      }
    }
  }

  getEvaluators() {
    return this._evaluators
  }

  hasEvaluators() {
    const { keywords, regex } = this.getEvaluators()
    return !!keywords.length && !!regex.length
  }

  setRoot(root: any) {
    this._root = root
    this.parser = makeRootsParser(root)
  }

  private _getEvaluatorOptions(options: any) {
    return {
      root: this._root,
      parser: this.parser,
      ...options,
    }
  }

  private _createInvalidate() {
    const reasons: string[] = []

    return {
      invalidate: (reason: string): void => {
        reasons.push(reason)
      },
      getResults: () => reasons,
    }
  }

  private _run(
    obj: any,
    callback: (options: RunEvaluatorsCallbackOptions, index: number) => void,
  ) {
    let properties: string[]

    if (typeof obj === 'object') {
      properties = Object.keys(obj)

      let value: any

      properties.forEach((key, index) => {
        value = obj[key]

        const options = {
          key,
          value,
          properties,
        } as RunEvaluatorsCallbackOptions

        let counter = 0

        // Check + invoke matching evaluators by keyword
        if (Array.isArray(this._evaluators.keywords[key])) {
          counter++
          options['evaluationType'] = 'keyword'
          this._evaluators.keywords[key].forEach((evaluate) => {
            callback(options, index)
          })
        } else {
          // Check + invoke matching evaluators by regex
          options['evaluationType'] = 'regex'
          // this._evaluators.regex.forEach(([regex, evaluate]) => {
          //   if (regex.test(key)) {
          //     this._evaluators.regex.forEach((evaluate) => {
          //       counter++
          //       callback(options, index)
          //     })
          //   }
          // })
        }
      })
      if (!Array.isArray(value)) {
        // TODO
        logError('Encountered a dead end in _run', { value })
      } else {
        value.forEach((value) => this._run(value, callback))
      }
    }
  }
}

async function runEvaluators({
  dirObjects,
  dirCompiled,
  dirPageObjects,
  saveAs,
}: {
  dirObjects: string
  dirCompiled: string
  dirPageObjects: string
  saveAs: string
}) {
  try {
    let basesObjects: any[] | undefined, pageObjects: any[] | undefined
    const saveAsFilePath = path.resolve(dirCompiled, saveAs)

    const root = {
      ...flattenArrayObjects(basesObjects),
      ...flattenArrayObjects(pageObjects),
    }

    await fs.ensureDir(dirCompiled)
    await fs.ensureDir(dirPageObjects)

    if (fs.existsSync(saveAsFilePath)) {
      log.blue('Deleting previous evaluation results...')
      await fs.unlink(saveAsFilePath)
      log.blue('Deleted previous evaluations')
      log.blank()
    }

    basesObjects = await getDirFilesAsJson(dirObjects)
    log.yellow(
      'Retrieved base noodl objects (root / noodl config, BaseCSS, BasePage, BaseDataModel',
    )
    pageObjects = await getDirFilesAsJson(dirPageObjects)
    log.yellow('Retrieved noodl page objects')
    log.blank()

    const noodlEvaluators = new NOODLEvaluator()
    noodlEvaluators.setRoot(root)
    log.green('Appended the root for incoming evaluations')
    log.blank()

    let evaluatorCount = 0
    // Add the evaluators
    // @ts-ignore
    evaluators.forEach((evaluate, trigger) => {
      noodlEvaluators.add(trigger, evaluate)
      log.green(`Added evaluator with trigger ${chalk.magentaBright(trigger)}`)
      evaluatorCount++
    })

    log.blank()
    log.green(`${evaluatorCount} evaluators set`)
    log.blank()

    // if (!noodlEvaluator.hasEvaluators()) {
    //   throw new Error(
    //     'Cannot run evaluations without any evaluators registered',
    //   )
    // }

    let pageObject, pageName
    for (let index = 0; index < pageObjects.length; index++) {
      pageObject = pageObjects[index]
      pageName = Object.keys(pageObject || {})[0]

      log.green(`Evaluating page: ${chalk.magentaBright(pageName)}`)

      noodlEvaluators.evaluate(pageObject, {
        pageName,
      })
    }

    await fs.writeJson(saveAsFilePath, noodlEvaluators.results, {
      spaces: 2,
    })
  } catch (error) {
    console.error(error)
  }
}

function flattenArrayObjects(arrObjects: any[] | undefined) {
  return (
    arrObjects && arrObjects.reduce((acc, obj) => Object.assign(acc, obj), {})
  )
}

export default runEvaluators
