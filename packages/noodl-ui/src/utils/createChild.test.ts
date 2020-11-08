import { expect } from 'chai'
import { IComponent, IComponentConstructor } from '../types'
import createChild from './createChild'

describe('createChild', () => {
  it('should retain the component instance values of the Component calling it', () => {
    class CustomComponent {
      children: any[] = []
      id = 'hello'
      get length() {
        return this.children.length
      }
      createChild(...args: Parameters<IComponent['createChild']>) {
        const child = createChild.call(this, ...args)
        this.children.push(child)
        return child
      }
    }
    const component = new CustomComponent()
    const child1 = component.createChild('listItem')
    const child2 = component.createChild('listItem')
    const child3 = component.createChild('listItem')
    expect(child1.id).to.eq('hello[0]')
    expect(child2.id).to.eq('hello[1]')
    expect(child3.id).to.eq('hello[2]')
  })
})
