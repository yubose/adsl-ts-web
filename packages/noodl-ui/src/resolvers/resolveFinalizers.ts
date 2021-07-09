import { Identify, userEvent } from 'noodl-types'
import { ConsumerOptions, NUIComponent, NUIActionObject } from '../types'
import { resolveAssetUrl } from '../utils/noodl'
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
