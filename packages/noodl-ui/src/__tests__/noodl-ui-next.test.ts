import _ from 'lodash'
import { expect } from 'chai'
import { NOODLComponent } from '../types'
import { noodlui } from '../utils/test-utils'
import Component from '../Component'
import Resolver from '../Resolver'
import Viewport from '../Viewport'

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
  it('should flip initialized to true when running init', () => {
    noodlui.init()
    expect(noodlui.initialized).to.be.true
  })

  it('should set the assets url', () => {
    const prevAssetsUrl = noodlui.assetsUrl
    noodlui.setAssetsUrl('https://google.com')
    expect(noodlui.assetsUrl).to.not.equal(prevAssetsUrl)
  })

  it('should set the page', () => {
    const pageName = 'Loopa'
    const pageObject = { module: 'paper', components: [] }
    noodlui.setRoot(pageName, pageObject)
    expect(noodlui.page.name).to.equal('')
    noodlui.setPage(pageName)
    expect(noodlui.page.name).to.equal(pageName)
    expect(noodlui.page.object).to.equal(pageObject)
  })

  it('should set the root', () => {
    const pageName = 'Loopa'
    const pageObject = { module: 'paper', components: [] }
    expect(noodlui.root).to.deep.equal({})
    noodlui.setRoot(pageName, pageObject)
    expect(noodlui.root).to.have.property(pageName, pageObject)
  })

  it('should set the viewport', () => {
    const viewport = new Viewport()
    expect(noodlui.viewport).to.not.equal(viewport)
    noodlui.setViewport(viewport)
    expect(noodlui.viewport).to.equal(viewport)
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
      const dataKey = 'formData.password'
      // noodlui.
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
        const listComponent = {
          type: 'list',
          iteratorVar: 'apple',
          listObject: [
            { firstName: 'chris', email: 'ppl@gmail.com' },
            { firstName: 'joe', email: 'pfpl@gmail.com' },
            { firstName: 'kelly', email: 'kelly@gmail.com' },
          ],
          children: [
            {
              type: 'listItem',
              children: [
                {
                  type: 'label',
                  dataKey: 'apple.email',
                },
                {
                  type: 'view',
                  children: [{ type: 'label', dataKey: 'apple.firstName' }],
                },
              ],
            },
          ],
        }
        const resolvedComponent = noodlui.resolveComponents(listComponent)
        console.info(resolvedComponent.toJS())
      })
    })

    describe('getDraftedNodes', () => {
      it('should return an object of component nodes where key is component id and value is the instance', () => {
        // console.info(noodlui.getDraftedNodes())
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

  describe('resolved component outcomes', () => {
    it('should attach a noodlType property with the original component type', () => {
      noodlComponent = { type: 'button', text: 'hello' }
      const resolvedComponent = noodlui.resolveComponents(noodlComponent)
      expect(resolvedComponent.toJS()).to.have.property('noodlType', 'button')
    })

    it('should convert the onClick to an action chain', () => {
      const onClick = [{ actionType: 'pageJump' }]
      const resolvedComponent = noodlui.resolveComponents({
        type: 'button',
        text: 'hello',
        onClick,
      })
      const snapshot = resolvedComponent.toJS()
      expect(snapshot.onClick).to.be.a('function')
    })
  })
})
