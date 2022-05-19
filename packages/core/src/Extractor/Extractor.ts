import * as t from '../types'

const spreadReducer =
  (fn1: (...args: any[]) => any, fn2: (...args: any[]) => any) =>
  (acc: any, [v1, v2]) =>
    fn1(acc, v1, fn2(v1, v2))

const flip = (fn: (...args: any[]) => any, ...args1: any[]) =>
  fn(...args1.slice().reverse())

class Extractor<INode = any> extends t.AExtractor<INode> {
  #root: t.ARoot
  #structures: t.AStructure[] = []
  #visitor: t.AVisitor;

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return {
      hasRoot: !!this.#root,
      hasVisitor: !!this.#visitor,
      structures: this.#structures,
    }
  }

  extract(...[data]: Parameters<t.AExtractor<INode>['extract']>) {
    const entries =
      this.#root.value instanceof Map
        ? [...this.#root.value.entries()]
        : Object.entries(this.#root.value)
    return entries.reduce(
      flip(
        spreadReducer,
        this.#visitor.visit.bind(this.#visitor),
        this.#root.value.bind(this.#root),
      ),
      this.#root.init(),
    )
  }

  use(value: Parameters<t.AExtractor<any>['use']>[0]) {
    if (value instanceof t.AVisitor) {
      this.#root = value
    } else if (value instanceof t.ARoot) {
      this.#root = value
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
    }
    // else if (value instanceof t.AVisitor) {
    //   this.#visitor = value
    //   value.use(({ name, value }) => {
    //     const structs = this.#structures.reduce(
    //       (acc, struct) =>
    //         struct.is(value) ? acc.concat(struct.createStructure(value)) : acc,
    //       [] as any[],
    //     )
    //     return structs
    //   })
    // }
    return this
  }
}

export default Extractor
