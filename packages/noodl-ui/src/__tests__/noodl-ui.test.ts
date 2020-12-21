import sinon from 'sinon'
import { expect } from 'chai'
import { NOODLComponent } from '../types'
import { noodlui } from '../utils/test-utils'
import { mock } from './mockData'
import Component from '../components/Base'
import List from '../components/List'
import Viewport from '../Viewport'

let noodlComponent: NOODLComponent
let component: Component

beforeEach(() => {
  noodlComponent = mock.raw.getNOODLView() as NOODLComponent
  component = new Component(noodlComponent)
})

describe('noodl-ui', () => {
  describe('when instantiating', () => {
    it('should flip initialized to true when running init', () => {
      noodlui.init()
      expect(noodlui.initialized).to.be.true
    })
  })

  describe('when resolving dataKeys referencing another global root object', () => {
    xit('should receive the value from a different root object', () => {
      // ex: Global.currentUser.vertex.id
    })
  })

  describe('when using createSrc', () => {
    it('should work for passing string paths', () => {
      const path = 'myimage.png'
      expect(noodlui.createSrc(path)).to.eq(noodlui.assetsUrl + path)
    })

    it('should work for passing if objects', () => {
      const path = {
        if: [true, 'selected.png', 'unselected.png'],
      } as any
      expect(noodlui.createSrc(path)).to.eq(noodlui.assetsUrl + 'selected.png')
      path.if[0] = false
      expect(noodlui.createSrc(path)).to.eq(
        noodlui.assetsUrl + 'unselected.png',
      )
      path.if[0] = () => true
      expect(noodlui.createSrc(path)).to.eq(noodlui.assetsUrl + 'selected.png')
    })

    describe('when using path emits', () => {
      it('should set the iteratorVar if it exists', () => {
        const emitObj = { emit: { dataKey: { var1: 'g' }, actions: [] } }
        const spy = sinon.spy()
        noodlui.use({ actionType: 'emit', fn: spy, trigger: 'path' })
        noodlui.createSrc(emitObj as any)
      })

      xit(
        'should map through all the registered path emit callbacks and take ' +
          'the first result it receives as the path value',
        () => {
          //
        },
      )

      describe('when passing options', () => {
        xit('should pass in the createSrc helper', () => {
          //
        })

        xit('should pass in the original path object', () => {
          //
        })

        xit('should pass in the component', () => {
          //
        })
      })

      describe('when a dataKey property is in the emit obj', async () => {
        xit('when the dataKey is an object', () => {
          //
        })

        xit('when the dataKey is a string', () => {
          //
        })
      })

      describe('when the dataKey property is NOT in the emit obj', () => {})
    })
  })
})

describe('when using getters', () => {
  it('should return the resolver context', () => {
    expect(noodlui.getContext()).to.have.keys([
      'actionsContext',
      'assetsUrl',
      'page',
    ])
  })

  it('should return all consumer options', () => {
    expect(noodlui.getConsumerOptions({} as any)).to.have.keys([
      'component',
      'componentCache',
      'context',
      'createActionChainHandler',
      'createSrc',
      'fetch',
      'getAssetsUrl',
      'getBaseStyles',
      'getCbs',
      'getPageObject',
      'getResolvers',
      'getRoot',
      'getState',
      'page',
      'parser',
      'plugins',
      'resolveComponent',
      'resolveComponentDeep',
      'showDataKey',
      'setPlugin',
      'viewport',
    ])
  })
})

describe('when using setters', () => {
  it('should set the assets url getter', () => {
    expect(noodlui.assetsUrl).not.to.eq('hello')
    noodlui.use({ getAssetsUrl: () => 'https://google.com' })
    expect(noodlui.assetsUrl).to.equal('https://google.com')
  })

  it('should set the page', () => {
    const pageName = 'Loopa'
    const pageObject = { module: 'paper', components: [] }
    noodlui.use({ getRoot: () => ({ [pageName]: pageObject }) })
    expect(noodlui.page).not.to.equal(pageName)
    noodlui.setPage(pageName)
    expect(noodlui.page).to.equal(pageName)
    expect(noodlui.getPageObject(pageName)).to.equal(pageObject)
  })

  it('should set the root getter', () => {
    const pageName = 'Loopa'
    const pageObject = { module: 'paper', components: [] }
    expect(noodlui.root).to.not.have.property(pageName, pageObject)
    noodlui.use({ getRoot: () => ({ [pageName]: pageObject }) })
    expect(noodlui.getConsumerOptions({} as any).getRoot()).to.have.property(
      pageName,
      pageObject,
    )
  })

  it('should set the viewport', () => {
    const viewport = new Viewport()
    expect(noodlui.viewport).to.not.equal(viewport)
    noodlui.setViewport(viewport)
    expect(noodlui.viewport).to.equal(viewport)
  })

  it('should not return as an array if arg passed was not an array', () => {
    const resolvedComponent = noodlui.resolveComponents(component)
    expect(resolvedComponent).to.be.instanceOf(Component)
  })
})

describe('when resolving components', () => {
  it('should attach a noodlType property with the original component type', () => {
    noodlComponent = { type: 'view', text: 'hello' }
    const resolvedComponent = noodlui.resolveComponents(noodlComponent)
    expect(resolvedComponent.toJS()).to.have.property('noodlType', 'view')
  })

  it('should convert onClick to a function', () => {
    const onClick = [{ actionType: 'pageJump' }]
    const resolvedComponent = noodlui.resolveComponents({
      type: 'button',
      text: 'hello',
      onClick,
    } as any)
    expect(resolvedComponent.get('onClick')).to.be.a('function')
  })

  it('should return as a single component if arg passed was passed as a non-array', () => {
    const resolvedComponent = noodlui.resolveComponents(component)
    expect(resolvedComponent).to.be.an.instanceOf(Component)
  })

  it('should return as array if arg passed was an array', () => {
    const resolvedComponent = noodlui.resolveComponents([component])
    expect(resolvedComponent).to.be.an('array')
    expect(resolvedComponent[0]).to.be.instanceOf(Component)
  })

  xit(
    'should apply the same resolvers as when calling .resolveComponents ' +
      'when children are created (including deeply nested children',
    () => {
      const noodlList = new List()
      const noodlListItem = noodlList.createChild('listItem')
      const component = noodlui.resolveComponents({
        type: 'view',
        children: [
          { type: 'button', text: 'hello', style: { fontSize: '14px' } },
          { type: 'label', text: 'my label' },
          { type: 'list', style: { width: '40px', height: '40px' } },
        ],
      })
    },
  )
})

describe('when creating action chain handlers', () => {
  it('should be able to be picked up by the action chain (builtin actions)', async () => {
    const appleSpy = sinon.spy()
    const swordSpy = sinon.spy()
    noodlui.use([
      { funcName: 'apple', fn: appleSpy },
      { funcName: 'sword', fn: swordSpy },
    ])
    const execute = noodlui.createActionChainHandler(
      [{ actionType: 'builtIn', funcName: 'apple' }],
      { component: new Component({ type: 'view' }) } as any,
    )
    await execute({})
    expect(appleSpy.called).to.be.true
  })

  it('should be able to be picked up by the action chain (non-builtin actions)', async () => {
    const appleSpy = sinon.spy()
    const swordSpy = sinon.spy()
    noodlui.use([
      { actionType: 'pageJump', fn: appleSpy },
      { actionType: 'updateObject', fn: swordSpy },
    ])
    let execute = noodlui.createActionChainHandler(
      [
        { actionType: 'pageJump', destination: '/hello' },
        { actionType: 'updateObject', object: sinon.spy() },
      ],
      { component: new Component({ type: 'view' }) } as any,
    )
    await execute({})
    expect(appleSpy.called).to.be.true
    // expect(swordSpy.called).to.be.true
    // const evalFn = sinon.spy()
    // noodlui.use({ actionType: 'evalObject', fn: evalFn })
    // expect(evalFn.called).to.be.false
    // execute = noodlui.createActionChainHandler(
    //   [{ actionType: 'evalObject', object: sinon.spy() }],
    //   { component: new Component({ type: 'view' }) } as any,
    // )
    // await execute({})
    // expect(evalFn.called).to.be.true
  })

  xit('should add in the builtIn funcs', async () => {
    const appleSpy = sinon.spy()
    const swordSpy = sinon.spy()
    noodlui.use([
      { funcName: 'apple', fn: appleSpy },
      { funcName: 'sword', fn: swordSpy },
    ])
    const execute = noodlui.createActionChainHandler(
      [{ actionType: 'builtIn', funcName: 'apple' }],
      { component: new Component({ type: 'view' }) } as any,
    )
    await execute({})
    expect(appleSpy.called).to.be.true
    // expect(swordSpy.called).to.be.true
  })

  xit('should pass in the actionsContext, component, pageName, pageObject and trigger', () => {
    //
  })
})
