import { expect } from 'chai'
import { IComponent, IComponentConstructor } from '../types'
import createChild from './createChild'
import Component from '../components/Base'

describe('createChild', () => {
  it('should retain the "this" value of the Component calling it', () => {
    class CustomComponent extends Component {
      constructor(...args: ConstructorParameters<IComponentConstructor>) {
        super(...args)
        this.id = 'hello'
      }
      createChild(...args: Parameters<IComponent['createChild']>) {
        const child = createChild.call(this, ...args)
        return child
      }
    }

    const component = new CustomComponent({ type: 'list' })
    const child1 = component.createChild('listItem')
    const child2 = component.createChild('listItem')
    const child3 = component.createChild('listItem')
    expect(child1.id).to.eq('hello[0]')
    expect(child2.id).to.eq('hello[1]')
    expect(child3.id).to.eq('hello[2]')
  })
})
