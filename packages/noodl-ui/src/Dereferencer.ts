import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import * as nu from 'noodl-utils'
import type NuiPage from './Page'
import resolveReference from './utils/resolveReference'
import resolvePageComponentUrl from './utils/resolvePageComponentUrl'
import * as c from './constants'
import * as t from './types'

class NuiDereferencer {
  #root: () => Record<string, any>

  constructor({ root }: { root: () => Record<string, any> }) {
    this.#root = root
  }
}

export default NuiDereferencer
