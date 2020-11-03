// @ts-nocheck
import { expect } from 'chai'
import _ from 'lodash'
import Component from '../../../components/Base'
import getTextBoardChildren from './getTextBoardChildren'
import { ComponentResolver } from '../../../types'
import makeComponentResolver from '../../../factories/makeComponentResolver'

let component: Component
let componentResolver: ComponentResolver
let resolverOptions: any

beforeEach(() => {
  component = new Component({
    id: 'someId',
    parentId: 'someParentId',
    type: 'label',
    textBoard: [
      { text: 'do not', color: 'blue' },
      { text: 'do' },
      {
        text: 'drugs',
        color: '0x000000',
      },
    ],
  })
  componentResolver = makeComponentResolver({ roots: {} })
  resolverOptions = componentResolver.getResolverOptions()
  resolverOptions = componentResolver.getResolverConsumerOptions({
    resolverOptions,
    component,
  })
})

describe('getTextBoardChildren', () => {
  it('number of children should be equivalent to the number of items in the textBoard', () => {
    getTextBoardChildren(component, resolverOptions)
    expect(component.get('children'))
      .to.be.an('array')
      .with.length(component.get('textBoard').length)
  })

  it('should create label components for each item that is expected to render text', () => {
    getTextBoardChildren(component, resolverOptions)
    _.forEach(component.get('children'), (child, index) => {
      expect(child).to.have.property('type', 'label')
      expect(child).to.have.property('style')
      expect(child).to.have.property(
        'children',
        component.get('textBoard')[index].text,
      )
    })
  })
})
