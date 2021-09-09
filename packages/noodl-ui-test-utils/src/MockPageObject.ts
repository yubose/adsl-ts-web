import { OrArray } from '@jsmanifest/typefest'
import * as u from '@jsmanifest/utils'
import { NUIAction, NuiComponent } from 'noodl-ui'
import {
  ActionObject,
  ComponentObject,
  PageObject,
  userEvent,
} from 'noodl-types'
import actionFactory from './factories/action'
import componentFactory from './factories/component'
import stateFactory from './factories/state'

interface Api<C extends ComponentObject> {
  component: C
  'data-key': {
    initialValue?: any
  }
  'data-value': {
    initialValue?: any
  }
}

class MockPageObject<
  O extends Record<keyof PageObject, PageObject[keyof PageObject]>,
> {
  #internal = stateFactory({})

  get state() {
    return this.#internal.state
  }

  action<A extends ActionObject>(actionObject: A) {
    return actionObject
  }

  component<C extends ComponentObject>(
    componentObject:
      | C
      | ((
          helpers: ReturnType<ReturnType<typeof stateFactory>['getHelpers']>,
        ) => Api<C>),
  ) {
    let component = componentObject as C

    if (u.isFnc(componentObject)) {
      const api = componentObject(this.#internal.getHelpers())
      component = api.component
    }

    return component
  }

  #userEvent = <Evt extends typeof userEvent[number]>(
    evt: Evt,
    ...actions: (ActionObject | Record<string, any>)[]
  ) => {
    return {
      [evt]: [...actions],
    }
  }
}

export default MockPageObject
