import _ from 'lodash'
import sinon from 'sinon'
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
  xit('should flip initialized to true when running init', () => {
    //
  })

  xit('should set the assets url', () => {
    //
  })

  xit('should set the root', () => {
    //
  })

  xit('should set the viewport', () => {
    //
  })

  xit('should set the consumer data', () => {
    //
  })

  xit('should set the component node', () => {
    //
  })

  xit('should set the list data', () => {
    //
  })

  describe('get', () => {
    xit('should parse the data key and return the value', () => {
      //
    })

    xit('should parse the reference key and return the evaluated result', () => {
      //
    })

    xit('should return the component node', () => {
      //
    })
  })

  describe('use', () => {
    xit('should set the viewport', () => {
      //
    })

    xit('should add the resolver', () => {
      //
    })
  })

  describe('emitting', () => {
    xit('should emit the event and call the callbacks associated with the event', () => {
      //
    })

    xit('should pass in the args to each callback', () => {
      //
    })
  })

  describe('Resolver', () => {
    xit('should change the component attrs accordingly', () => {
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

  it('should not return as an array if arg passed was not an array', () => {
    const resolvedComponent = noodlui.resolveComponents(component)
    expect(resolvedComponent).to.be.instanceOf(Component)
  })

  it('should return as array if arg passed was an array', () => {
    const resolvedComponent = noodlui.resolveComponents([component])
    expect(resolvedComponent).to.be.an('array')
    expect(resolvedComponent[0]).to.be.instanceOf(Component)
  })

  it('should return the resolver context', () => {
    expect(noodlui.getContext()).to.have.keys([
      'assetsUrl',
      'page',
      'roots',
      'viewport',
    ])
  })

  it('should return all resolve options', () => {
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

  it('should return all consumer options', () => {
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

  describe('actions/action chains', () => {
    xit('should pass in action callbacks as an object where values are array of functions', () => {
      //
    })

    xit('should pass in builtIn callbacks where funcNames are keys and array of funcs are its values', () => {
      //
    })

    xit('should pass in the trigger type', () => {
      //
    })

    xit('should pass in consumer options', () => {
      //
    })

    xit('should invoke action callbacks correctly', () => {
      //
    })

    xit('should invoke builtIn callbacks correctly', () => {
      //
    })

    xit('should invoke chaining callbacks correctly', () => {
      //
    })

    xit('should pass in the right args for action callbacks', () => {
      //
    })

    xit('should pass in the right args for builtIn callbacks', () => {
      //
    })

    xit('should pass in the right args for beforeResolve callbacks', () => {
      //
    })

    xit('should pass in the right args for chainStart callbacks', () => {
      //
    })

    xit('should pass in the right args for chainEnd callbacks', () => {
      //
    })

    xit('should pass in the right args for chainAbort callbacks', () => {
      //
    })

    xit('should pass in the right args for chainError callbacks', () => {
      //
    })

    xit('should pass in the right args for chainTimeout callback', () => {
      //
    })

    xit('should pass in the right args for afterResolve callbacks', () => {
      //
    })
  })

  describe('state api', () => {
    describe('consume', () => {
      it('should return the item', () => {
        //
      })
    })

    describe('getDraftedNodes', () => {
      xit('should return an object of component nodes where key is component id and value is the instance', () => {
        //
      })
    })

    describe('getDraftedNode', () => {
      xit('should return the component instance', () => {
        //
      })
    })

    describe('getList', () => {
      xit('should return an object where key is list id and their value is the list (listObject in NOODL terms)', () => {
        //
      })
    })

    describe('getListItem', () => {
      xit('should return the list item', () => {
        //
      })
    })
  })
})
