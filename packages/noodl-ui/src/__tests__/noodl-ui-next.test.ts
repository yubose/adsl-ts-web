import _ from 'lodash'
import { expect } from 'chai'
import { NOODLComponent } from '../types'
import { noodlui } from '../utils/test-utils'
import Component from '../Component'
import Resolver from '../Resolver'

let noodlComponent: NOODLComponent
let component: Component

beforeEach(() => {
  noodlComponent = {
    type: 'view',
    viewTag: 'subStream',
    required: false,
    style: {
      fontStyle: 'bold',
      left: '0.015',
      top: '0',
      width: '0.15',
      height: '0.15',
      border: {
        style: '5',
      },
      borderRadius: '5',
    },
  } as NOODLComponent
  component = new Component(noodlComponent)
  component.createChild({
    type: 'view',
    children: [
      {
        type: 'view',
        children: [
          {
            type: 'list',
            children: [
              {
                type: 'listItem',
                itemObject: '',
                children: [
                  {
                    type: 'label',
                    text: 'my label',
                    style: { width: '0.5' },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  })
})

afterEach(() => {
  noodlui.cleanup()
})

describe('noodl-ui', () => {
  describe('Resolver', () => {
    it('should change the component attrs accordingly', () => {
      const r = new Resolver()
      r.setResolver((c, options) => {
        c.set('src', 'HELLO')
      })
      noodlui.use(r)
      const component = new Component({
        type: 'label',
        style: {},
        id: 'avc123',
      })
      const resolvedComponent = noodlui.resolveComponents(component)
      expect(component.get('src')).to.equal('HELLO')
      expect(resolvedComponent.toJS().src).to.equal('HELLO')
    })
  })

  it('should return the resolved components', () => {
    const r = new Resolver()
    r.setResolver((c, options) => {
      c.set('src', 'HELLO')
    })
    noodlui.use(r)
    const resolvedComponent = noodlui.resolveComponents(component)
    expect(resolvedComponent).to.be.instanceOf(Component)
  })

  it('should return the resolver context', () => {
    expect(noodlui.getContext()).to.have.keys([
      'assetsUrl',
      'page',
      'roots',
      'viewport',
    ])
  })

  it('should return resolver consumer options', () => {
    expect(noodlui.getConsumerOptions()).to.have.keys([
      'consume',
      'context',
      'createActionChain',
      'createSrc',
      'getDraftedNode',
      'getDraftedNodes',
      'getList',
      'getListItem',
      'getState',
      'parser',
      'resolveComponent',
      'setConsumerData',
      'setDraftNode',
      'setList',
      'showDataKey',
    ])
  })

  it('should return resolver options', () => {
    expect(noodlui.getResolverOptions()).to.have.keys([
      'consume',
      'context',
      'getDraftedNode',
      'getDraftedNodes',
      'getList',
      'getListItem',
      'getState',
      'parser',
      'resolveComponent',
      'setConsumerData',
      'setDraftNode',
      'setList',
    ])
  })
})
