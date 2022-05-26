import partial from 'lodash/partial'
import { is as coreIs } from 'noodl-core'
import is from './is'
import unwrap from './unwrap'

function has(...keys: (number | string)[]): (node: any) => boolean
function has(...args: any[]): boolean
function has(...args: any[]) {
  const last = args[args.length - 1]

  // @ts-expect-error
  if (coreIs.num(last) || coreIs.str(last)) return partial(has, ...args)

  if (is.mapNode(last) || is.documentNode(last) || is.seqNode(last)) {
    return args.some((key) => last.has(key))
  }

  if (is.pairNode(last)) {
    return args.some((key) => unwrap(last.key) === key)
  }

  return false
}

export default has
