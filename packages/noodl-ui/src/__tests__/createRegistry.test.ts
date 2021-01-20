import createComponent from '../utils/createComponent'
import { noodlui } from '../utils/test-utils'
import createRegistry from '../createRegistry'

let registry: ReturnType<typeof createRegistry>

beforeEach(() => {
  registry = createRegistry({ ref: noodlui })
})

describe('createRegistry', () => {
  describe('register', () => {
    xit('should add the register object to the right location', () => {
      const component = createComponent({
        type: 'register',
        noodlType: 'register',
        onEvent: 'onPersonJoin',
        actions: [{ actionType: 'pageJump', destination: 'CircuitCity' }],
      })
      registry.register(component)
    })

    xit('should initiate the object if it doesnt already exist', () => {
      //
    })
  })

  describe('exists', () => {
    xit('should be able to find the value by event name', () => {
      //
    })
  })

  describe('get', () => {
    xit('should return the register object', () => {
      //
    })
  })

  describe('getRegisterInfo', () => {
    xit('should return the info', () => {
      //
    })
  })
})
