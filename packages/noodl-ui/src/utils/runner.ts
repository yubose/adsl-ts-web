import { ComponentObject } from 'noodl-types'
import produce from 'immer'
import NOODLUI from '../noodl-ui'
import { getAllResolversAsMap } from '../utils/getAllResolvers'
import * as T from '../types'

function runner(noodlui: NOODLUI) {
  const resolvers = Object.values(getAllResolversAsMap())
  const createEmpty = (obj?: any) => Object.assign({}, obj)
  const mutator = (mutate) => (step) => (acc, obj) => step(acc, mutate(obj))
  const filter = (pred) => (step) => (acc, obj) =>
    pred(obj) ? acc : step(acc, obj)
  const step = (acc, o) => acc(o)

  const compose = (...fns) => (x) => {
    const obj = createEmpty()
    return fns.reduceRight((acc, fn) => step(acc, fn(acc)), {
      component: obj,
      draft: x,
    })
  }

  const oo = (obj) => ({
    unwrap: (x) => x,
  })

  return {
    run(obj: ComponentObject, options: T.ConsumerOptions) {
      const xform = compose(setFonts)
      const props = produce(obj, (draft) => {
        resolvers.forEach((resolve) => {})
      })
    },
  }
}

export default runner
