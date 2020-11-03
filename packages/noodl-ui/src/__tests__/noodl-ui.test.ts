import _ from 'lodash'
import { expect } from 'chai'
import { IComponent, NOODLComponent, IComponentTypeInstance } from '../types'
import { noodlui } from '../utils/test-utils'
import { mock } from './mockData'
import ActionChain from '../ActionChain'
import Component from '../components/Base'
import Viewport from '../Viewport'

let noodlComponent: NOODLComponent
let component: IComponent

beforeEach(() => {
  noodlComponent = mock.raw.getNOODLView() as NOODLComponent
  component = new Component(noodlComponent) as IComponent
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

  it('should set the component node', () => {
    const component = new Component({ type: 'list' }) as IComponentTypeInstance
    expect(noodlui.getNode(component)).to.be.null
    noodlui.setNode(component)
    expect(noodlui.getNode(component)).to.equal(component)
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

  describe('emitting', () => {
    xit('should emit the event and call the callbacks associated with the event', () => {
      //
    })

    xit('should pass in the args to each callback', () => {
      //
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

  xit('should return all resolve options', () => {
    expect(noodlui.getResolverOptions()).to.have.keys([
      'consume',
      'context',
      'getNode',
      'getNodes',
      'getList',
      'getListItem',
      'getState',
      'parser',
      'resolveComponent',
      'setConsumerData',
      'setNode',
      'setList',
    ])
  })

  xit('should return all consumer options', () => {
    expect(noodlui.getConsumerOptions()).to.have.keys([
      'consume',
      'context',
      'createActionChain',
      'createSrc',
      'getNode',
      'getNodes',
      'getList',
      'getListItem',
      'getState',
      'parser',
      'resolveComponent',
      'setConsumerData',
      'setNode',
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
    describe('getNodes', () => {
      it('should return an object of component nodes where key is component id and value is the instance', () => {
        // console.info(noodlui.getNodes())
      })
    })

    describe('getNode', () => {
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

    xdescribe('lists', () => {
      it(
        "should be able to retrieve list data using the list component's " +
          'component id',
        () => {
          const data = ['fruits']
          const noodlComponent = mock.raw.getNOODLList()
          const component = noodlui.resolveComponents(noodlComponent)
          component.set('iteratorVar', data)
          const listItem1 = component.createChild('listItem')
          const child = listItem1.createChild('view')
          const childOfChild = child.createChild('label')
          // const listObject = noodlui.getList(`${component.id}` || '')
          console.info(childOfChild.toJS())
        },
      )
      xit(
        'should be able to retrieve list data by directing using the ' +
          "list component's instance",
        () => {
          const nooft = noodlui.getList()
        },
      )

      xit(
        "should be able to retrieve a list item component's data object " +
          'using their component id',
        () => {
          //
        },
      )

      xit(
        "should be able to retrieve a list item component's data object " +
          'using their component instance',
        () => {
          //
        },
      )

      xit(
        "should be able to retrieve a list item component's data object " +
          'by using their component id',
        () => {
          //
        },
      )

      xit(
        "should be able to retrieve a list item component's data object " +
          'by directly using their component instance',
        () => {
          //
        },
      )

      xit(
        "should be able to retrieve a list item component's data object " +
          "using their parent's instance",
        () => {
          //
        },
      )
      xit(
        "should be able to retrieve a list item component's data object " +
          "using their parent's component id",
        () => {
          //
        },
      )
    })
  })

  xdescribe('resolved component outcomes', () => {
    it('should attach a noodlType property with the original component type', () => {
      noodlComponent = { type: 'view', text: 'hello' }
      const resolvedComponent = noodlui.resolveComponents(noodlComponent)
      expect(resolvedComponent.toJS()).to.have.property('noodlType', 'view')
    })

    it('should convert the onClick to an action chain', () => {
      const onClick = [{ actionType: 'pageJump' }]
      const resolvedComponent = noodlui.resolveComponents({
        type: 'button',
        text: 'hello',
        onClick,
      })
      expect(resolvedComponent.get('onClick')).to.be.instanceOf(ActionChain)
    })
  })
})
