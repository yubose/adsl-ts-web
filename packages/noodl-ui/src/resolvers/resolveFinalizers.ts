import type { ConsumerOptions } from '../types'
import Resolver from '../Resolver'

const asyncResolver = new Resolver('resolveFinalizer')

async function resolveFinalizer({
  createActionChain,
  getAssetsUrl,
}: ConsumerOptions) {
  //
}

asyncResolver.setResolver((component, options) => {
  //
})

export default asyncResolver
