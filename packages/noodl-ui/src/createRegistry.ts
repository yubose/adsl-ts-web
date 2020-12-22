import NOODLUI from './noodl-ui'
import { ComponentInstance, RegistryObject, State,  } from './types'
import isComponent from './utils/isComponent'

const createRegistry = function createRegistry({ ref }: { ref: NOODLUI }) {
  const registry = {} as State['registry']

  function _init(initialState?: Partial<RegistryObject>): RegistryObject {
    const register = {
      called: false,
      callCount: 0,
      callbacks: [],
      page: '',
      refs: {
        components: []
      }
    } as RegistryObject
    if (initialState) {
      Object.keys(initialState).forEach((key: keyof RegistryObject) => {
        if (key === 'callbacks') {
          register.callbacks = initialState.callbacks as RegistryObject['callbacks']
        } else if (key === 'refs') {
          Object.assign(register.refs, initialState.refs)
        }
      })
    }
    return register
  }

  const o = {
    exists(component: ComponentInstance): boolean
    exists(eventName: string): boolean
    exists(component: ComponentInstance | string) {
      if (typeof component === 'string') {
        const eventName = component
        // TODO - more search locations
        registe
      } else if (isComponent(component)) {
        const registerInfo = o.getRegisterInfo(component)
        if (registerInfo) {
          const { eventName = '', registerId = '' } = registerInfo
          return !!registry[eventName]
        }
      }
    
      return false
    },
    get() {

    },
    getRegisterInfo(component: ComponentInstance) {
      if (isComponent(component)) {
        if (component.get('onEvent')) {
          const registerConfig = registry.onEvent
          return {
            eventName: 'onEvent',
            pageName: 
            registerId: component.get('onEvent'),
          }
        }
      }
      return null
    },
    // TODO - Support other types of register args
    register(component: ComponentInstance) {
      if (isComponent(component)) {
        if (component.noodlType === 'register') {
          // TODO - Other ways that identifies event ids
          if (component.get('onEvent')) {

          }
        }
      } else {
        //
      }
      return this
    },
  }

  return o
}

export default createRegistry
