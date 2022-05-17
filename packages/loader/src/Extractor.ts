import * as t from './types'

const spreadReducer =
  (fn1: (...args: any[]) => any, fn2: (...args: any[]) => any) =>
  (acc: any, [v1, v2]) =>
    fn1(acc, v1, fn2(v1, v2))

const flip = (fn: (...args: any[]) => any, ...args1: any[]) =>
  fn(...args1.slice().reverse())

class Extractor<INode = any, INext = any> extends t.AExtractor<INode> {
  #data = {} as Record<string, INode>
  #accumulator: t.Accumulator
  #iterator: t.AIterator<INode, INext>
  #structures: t.AStructure[] = []
  #visitor: t.AVisitor;

  [Symbol.iterator]() {
    return this.#iterator.getIterator(this.#iterator.getItems(this.#data))
  }

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return {
      hasAccumulator: !!this.#accumulator,
      hasIterator: !!this.#iterator,
      hasVisitor: !!this.#visitor,
      structures: this.#structures,
    }
  }

  extract(...[data]: Parameters<t.AExtractor<INode>['extract']>) {
    this.#data = data
    return [...this].reduce(
      flip(
        spreadReducer,
        this.#visitor.visit.bind(this.#visitor),
        this.#accumulator.reduce.bind(this.#accumulator),
      ),
      this.#accumulator.init(),
    )
  }

  use(value: Parameters<t.AExtractor<any>['use']>[0]) {
    if (value instanceof t.Accumulator) {
      this.#accumulator = value
    } else if (value instanceof t.AIterator) {
      this.#iterator = value
    } else if (value instanceof t.AStructure) {
      const currIndex = this.#structures.findIndex(
        (struct) => struct.name === value.name,
      )
      if (currIndex > -1) {
        // Overwrite the existing one in case they updated some setting
        this.#structures.splice(currIndex, 1, value)
      } else {
        this.#structures.push(value)
      }
    } else if (value instanceof t.AVisitor) {
      this.#visitor = value
      value.use(({ name, value }) => {
        const structs = this.#structures.reduce(
          (acc, struct) =>
            struct.is(value) ? acc.concat(struct.createStructure(value)) : acc,
          [] as any[],
        )
        return structs
      })
    }
    return this
  }
}

export default Extractor
