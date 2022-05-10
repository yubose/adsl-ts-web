const { AIterator } = require('@noodl/core')

class ObjIterator extends AIterator {
  /**
   * @param { [name: string, object: any][] } data
   */
  getIterator(data) {
    const items = data.reverse()
    return {
      next() {
        return {
          get value() {
            return items.pop()
          },
          done: !items.length,
        }
      },
    }
  }

  getItems(data) {
    return Object.entries(data).map(([name, value]) => [name, value])
  }
}

module.exports = ObjIterator
