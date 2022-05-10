import * as fp from './utils/fp'
import * as is from './utils/is'
import * as t from './types'

class Builder {
  #data: any
  #iterator: t.AIterator<any> | null = null
  #root: t.ARoot | null = null
  #visitor: t.AVisitor | null = null

  set data(data) {
    this.#data = data || this.#root?.value
  }

  get data() {
    return this.#data
  }

  get iterator() {
    return this.#iterator
  }

  get visitor() {
    return this.#visitor
  }

  get root() {
    return this.#root
  }

  /**
   * TODO - Extend
   * @param helpers
   * @returns
   */
  createHelpers(helpers?: any) {
    return { ...helpers }
  }

  /**
   * TODO - Extend
   * @param data
   * @returns
   */
  createData(data?: any) {
    return data
  }

  /**
   * TODO - Extend
   * @param props
   * @returns
   */
  createProps<P = any>(props: P & { value: any }) {
    if (!is.arr(props.value)) {
      throw new Error(
        `Each item of iterator must return a tuple [name, value] but received "${typeof props.value}"`,
      )
    }

    return props
  }

  use(value: t.AIterator<any> | t.ARoot | t.AVisitor) {
    if (value instanceof t.AIterator) {
      this.#iterator = value
    } else if (value instanceof t.ARoot) {
      this.#root = value
    } else if (value instanceof t.AVisitor) {
      this.#visitor = value
    }
    return this
  }
}

export default Builder
