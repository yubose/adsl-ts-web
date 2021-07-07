import * as u from '@jsmanifest/utils'
import * as t from '../types'

const resolverFactory = function () {
  const createResolver = function <RT = any>(fn: t.Resolve.Func<RT>) {
    const resolve: t.Resolve.Func<RT> = function (node, component, options) {
      return new Promise((resolve, reject) => {
        try {
          resolve(fn(node, component, options))
        } catch (error) {
          reject(error)
        }
      })
    }

    return resolve
  }

  return {
    createResolver,
  }
}

export default resolverFactory
