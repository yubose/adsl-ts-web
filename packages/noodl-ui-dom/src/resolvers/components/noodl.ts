import { RegisterOptions } from '../../types'

export default {
  name: '[noodl-ui-dom] noodl',
  cond: 'noodl',
  resolve(node: HTMLIFrameElement, component) {
    component.on('path', (result: string) => {
      console.log(`RECEIVED SRC`, result)
      console.log(`RECEIVED SRC`, result)
      console.log(`RECEIVED SRC`, result)
      console.log(`RECEIVED SRC`, result)
      console.log(`RECEIVED SRC`, result)
      console.log(`RECEIVED SRC`, result)
      console.log(`RECEIVED SRC`, result)
      node && ((node as HTMLIFrameElement).src = result)
    })
  },
} as RegisterOptions
