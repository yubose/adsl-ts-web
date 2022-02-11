import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'

const objectFns = {
  setProperty: (dataIn: Record<string, any>, dataOut?: any) => {},
}

const builtIns = {
  [`=.builtIn.string.equal`]: (string1 = '', string2 = '') =>
    string1 === string2,
  // [`=.builtIn.object.setProperty`]
}

export default builtIns
