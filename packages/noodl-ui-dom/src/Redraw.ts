import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import { NUIComponent } from 'noodl-ui'
import * as t from './types'

export interface RedrawState {
  //
}

class Redrawer {
  #state = {} as RedrawState

  get state() {
    return this.#state
  }

  async redraw<N extends t.NDOMElement>(
    node: N,
    component: NUIComponent.Instance,
  ) {
    try {
      //
    } catch (error) {
      console.error(error)
      if (error instanceof Error) throw error
      throw new Error(error)
    }
  }
}

export default Redrawer
