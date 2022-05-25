const u = require('@jsmanifest/utils')
const { AVisitor } = require('@noodl/core')

/**
 * Untested / Not confirmed to be stable
 */
function visit(fn, value, parent) {
  let results = []

  if (u.isArr(value)) {
    results = results.concat(
      value.reduce((acc, val, index) => {
        const result = fn(index, val, value)
        if (!u.isUnd(result)) acc.push(result)
        acc.push(...visit(fn, val, value))
        return acc
      }, []),
    )
  } else if (u.isObj(value)) {
    for (const [key, val] of u.entries(value)) {
      const result = fn(key, val, value)
      if (!u.isUnd(result)) results.push(result)
      results.push(...visit(fn, val, value))
    }
  } else {
    const result = fn(null, value, parent)
    if (!u.isUnd(result)) results.push(result)
  }

  return results
}

class ObjVisitor extends AVisitor {
  #callback

  get callback() {
    return this.#callback
  }

  /**
   * @param { [name: string, object: any]} args
   * @param { Parameters<import('@noodl/core').AVisitor['callback']>[0] } options
   * @returns Visitor data
   */
  visit(args, options) {
    const [name, value] = args
    const data = options?.data || {}

    options?.init?.(data)

    visit(
      (key, val, parent) => {
        this.#callback?.({
          data,
          name,
          key,
          value: val,
          path: u.array(parent),
          ...u.omit(options, ['init']),
        })
      },
      value,
      null,
    )

    return data
  }

  /**
   * @param { [name: string, object: any]} args
   * @param { Parameters<import('@noodl/core').AVisitor['callback']>[0] } options
   * @returns Visitor data
   */
  async visitAsync(args, options) {
    const [name, value] = args
    const data = options?.data || {}

    await options?.init?.(data)

    return data
  }

  use(callback) {
    this.#callback = callback
    return this
  }
}

module.exports = ObjVisitor
