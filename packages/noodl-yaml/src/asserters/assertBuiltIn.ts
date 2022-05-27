import { consts, is as coreIs, fp } from 'noodl-core'
import { visit } from 'yaml'
import deref from '../utils/deref'
import is from '../utils/is'
import unwrap from '../utils/unwrap'
import { createAssert } from '../assert'
import * as t from '../types'

export default createAssert({
  cond: is.builtInFn,
  fn({ add, data, builtIn, node, markers, page, root }, { set }) {
    if (is.builtInFn(node)) {
      const builtInKey = unwrap(node.items[0].key)
      const builtInObject = node.get(builtInKey)
      const builtInPath = builtInKey.replace('=.builtIn.', '')

      if (is.mapNode(builtInObject)) {
        const dataIn = builtInObject.get('dataIn', false)
        const dataOut = builtInObject.get('dataOut', false)
        const builtInFn = fp.get(builtIn, builtInPath)

        if (coreIs.fnc(builtInFn)) {
          const fnArgs = {
            add,
            builtIns: builtIn,
            builtInKey,
            builtInObject,
            builtInPath,
            data,
            dataOut,
            node,
            page,
            root,
          }
          let builtInResult = builtInFn(
            builtIn?.normalize ? builtIn.normalize(dataIn, fnArgs) : dataIn,
            fnArgs,
          )
          if (coreIs.str(builtInResult)) {
            if (coreIs.reference(builtInResult)) {
              builtInResult = deref({
                node: builtInResult,
                root,
                rootKey: page,
              }).value
            }
          }

          if (coreIs.str(dataOut)) {
            set(dataOut, builtInResult, root, page)
          }
        } else {
          // TODO
        }
      }
    }
  },
})
