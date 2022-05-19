import { ARoot } from '@noodl/core'
import { createFileSystem } from '@noodl/file'

import * as t from './types'

class Extractor<INode = any> extends t.AExtractor<INode> {
  #fs: ReturnType<typeof createFileSystem> | undefined
  #root: ARoot | undefined;

  [Symbol.iterator]() {
    return this.#root?.[Symbol.iterator]()
  }

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return {
      hasAccumulator: !!this.#root,
    }
  }

  constructor() {
    super()
  }

  get fs() {
    return this.#fs
  }

  extract<R = any>(
    cb: (name: string, node: INode, utils: Extractor['fs']) => any,
  ) {
    const results = [] as R[]

    for (const [name, value] of this) {
      const result = cb(name, value, this.fs)
      if (result) results.push(result)
    }

    return results
  }

  use(value: Parameters<t.AExtractor<any>['use']>[0]) {
    if (value instanceof ARoot) {
      this.#root = value
    } else if (value instanceof t.AStructure) {
      // const currIndex = this.#structures.findIndex(
      //   (struct) => struct.name === value.name,
      // )
      // if (currIndex > -1) {
      //   // Overwrite the existing one in case they updated some setting
      //   this.#structures.splice(currIndex, 1, value)
      // } else {
      //   this.#structures.push(value)
      // }
    } else if (value && typeof value === 'object') {
      if ('readFile' in value || 'writeFile' in value) {
        this.#fs = createFileSystem(value)
      }
    }
    return this
  }
}

export default Extractor
