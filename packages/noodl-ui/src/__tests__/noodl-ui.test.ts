import _ from 'lodash'
import { expect } from 'chai'
import { IComponent, NOODLComponent } from '../types'
import { noodlui } from '../utils/test-utils'
import { mock } from './mockData'
import ActionChain from '../ActionChain'
import Component from '../Component'
import Resolver from '../Resolver'
import Viewport from '../Viewport'

let noodlComponent: NOODLComponent
let component: IComponent

beforeEach(() => {
  noodlComponent = mock.raw.getNOODLView() as NOODLComponent
  component = new Component(noodlComponent) as IComponent
  // component.createChild({
  //   type: 'view',
  //   children: [
  //     {
  //       type: 'view',
  //       children: [
  //         {
  //           type: 'list',
  //           listObject,
  //           children: [
  //             {
  //               type: 'listItem',
  //               itemObject: '',
  //               children: [
  //                 {
  //                   type: 'label',
  //                   text: 'my label',
  //                   style: { width: '0.5' },
  //                 },
  //               ],
  //             },
  //           ],
  //         },
  //       ],
  //     },
  //   ],
  // })
})

afterEach(() => {
  noodlui.cleanup()
})

describe('noodl-ui', () => {
  xdescribe('implementation details', () => {
    it('should flip initialized to true when running init', () => {
      noodlui.init()
      expect(noodlui.initialized).to.be.true
    })

    describe('lists', () => {
      it('should add the list using the component instance as the key', () => {
        const list = mock.other.getNOODLListObject()
        noodlui.setList(component, list)
        expect(noodlui.getState().lists.has(component)).to.be.true
      })

      it('should receive the list data using the component instance', () => {
        const list = mock.other.getNOODLListObject()
        noodlui.setList(component, list)
        expect(noodlui.getList(component)).to.equal(list)
      })

      it('should receive the list data using the component id', () => {
        const list = mock.other.getNOODLListObject()
        noodlui.setList(component, list)
        expect(noodlui.getList(component)).to.equal(list)
      })
    })
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

  xit('should set the component node', () => {
    //
  })

  xdescribe('working with list data', () => {
    it('should retrieve the list item if passing in the list item component instance', () => {
      const component = new Component({
        type: 'list',
        listObject: mock.other.getNOODLListObject(),
        children: [mock.raw.getNOODLListItem()],
      })
      noodlui.resolveComponents(component)
      const listItemComponent = component.child()
      const list = noodlui.getListItem(listItemComponent)
      console.info(list)
    })

    xit('should retrieve the list item if passing in any nested child instance under the list item component instance', () => {
      //
    })

    xit('should retrieve the list item if passing in a component id that links to a component instance anywhere in the list item tree', () => {
      //
    })

    xit('should set the component instance as the key', () => {
      //
    })
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

  xit('should not return as an array if arg passed was not an array', () => {
    const resolvedComponent = noodlui.resolveComponents(component)
    expect(resolvedComponent).to.be.instanceOf(Component)
  })

  xit('should return as array if arg passed was an array', () => {
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

    describe('lists', () => {
      it(
        "should be able to retrieve list data using the list component's " +
          'component id',
        () => {
          const noodlComponent = mock.raw.getNOODLList()
          const component = noodlui.resolveComponents(noodlComponent)
          const listObject = noodlui.getList(component.id)
          console.info(noodlui.getState().lists)
          console.info(listObject)
          console.info(listObject)
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
