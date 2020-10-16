import { expect } from 'chai'
import _ from 'lodash'
import getChildrenDefault from './getChildrenDefault'
import Component from '../../../Component'
import { IComponent, ResolverOptions, ConsumerOptions } from '../../../types'
import { ResolverTest, makeResolverTest } from '../../../utils/test-utils'

describe('getChildrenDefault', () => {
  let component: IComponent
  let resolverOptions: ConsumerOptions & {
    resolverOptions: ResolverOptions
  }
  let resolve: ResolverTest

  beforeEach(() => {
    component = new Component({
      type: 'button',
      id: 'someId',
      style: { border: { style: '3' } },
    })

    resolve = makeResolverTest({ roots: {}, resolvers: getChildrenDefault })
    resolverOptions = resolve((componentResolver) =>
      componentResolver.getResolverConsumerOptions({
        component,
        resolverOptions: componentResolver.getResolverOptions(),
      }),
    )
  })

  it.skip('should assign the expected props to this single child', () => {
    component.set('children', {
      type: 'label',
      text: 'school',
      style: { width: '0.2', height: '0.1' },
    } as any)
    getChildrenDefault(component, resolverOptions)
    const resolvedComponent = component.snapshot()
    expect(resolvedComponent).to.have.property('children')
    expect(resolvedComponent.children).to.have.property('id')
  })

  it.skip('should expect the injected children to be in the same shape as the component passed in', () => {
    component.set(
      'children',
      _.map(Array(3), () => {
        return {
          type: 'label',
          text: 'school',
          style: { width: '0.2', height: '0.1' },
        }
      }),
    )
    getChildrenDefault(component, resolverOptions)
    const resolvedComponent = component.snapshot()
    expect(_.isArray(resolvedComponent.children)).to.be.true
  })

  it.skip('should map over each child in children if its an array and assign the expected props to them', () => {
    component.set(
      'children',
      _.map(Array(3), () => ({
        type: 'label',
        text: 'school',
        style: { width: '0.2', height: '0.1' },
      })),
    )
    getChildrenDefault(component, resolverOptions)
    const resolvedComponent = component.snapshot()
    expect(resolvedComponent.children[0]?.id?.endsWith('[0]')).to.be.true
    expect(resolvedComponent.children[1]?.id?.endsWith('[1]')).to.be.true
    expect(resolvedComponent.children[2]?.id?.endsWith('[2]')).to.be.true
  })
})
