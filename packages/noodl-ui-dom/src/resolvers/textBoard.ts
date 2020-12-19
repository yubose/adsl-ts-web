import { RegisterOptions } from '../types'

// TODO - test to see if we even need this
export default {
  name: 'textBoard',
  cond: (node, component) => !!component.get('textBoard'),
  resolve(node, component) {
    //
  },
} as RegisterOptions
