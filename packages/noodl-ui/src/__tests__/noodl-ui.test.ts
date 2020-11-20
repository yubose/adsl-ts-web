import _ from 'lodash'
import sinon from 'sinon'
import { expect } from 'chai'
import {
  IComponent,
  NOODLComponent,
  IComponentTypeInstance,
  IList,
  IListItem,
} from '../types'
import { noodlui } from '../utils/test-utils'
import { mock } from './mockData'
import ActionChain from '../ActionChain'
import Component from '../components/Base'
import List from '../components/List'
import Viewport from '../Viewport'
import ListItem from '../components/ListItem'
import createComponent from '../utils/createComponent'
import { findParent } from 'noodl-utils'

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
  describe('when instantiating', () => {
    it('should flip initialized to true when running init', () => {
      noodlui.init()
      expect(noodlui.initialized).to.be.true
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

    it(
      'should still resolve successfuly to the src even if the callback ' +
        'is a promise',
      async () => {
        //
      },
    )

    describe('when passing an emit object', () => {
      describe('when providing a component', () => {
        it('should work for passing emit objects', () => {
          const iteratorVar = 'hello'
          const path = {
            emit: {
              dataKey: {
                var1: iteratorVar,
              },
              actions: [
                {
                  if: [() => false, {}, {}],
                },
              ],
            },
          }
          const view = createComponent('view')
          const listItem = new ListItem()
          listItem.setDataObject({ fruit: 'apple', ext: '.png' })
          const image = createComponent('image')
          image.set('path', path)
          view.createChild(listItem)
          listItem.createChild(image)
          // @ts-expect-error
          noodlui.use({
            actionType: 'emit',
            fn: (path: any, component: any) => {
              const listItemComponent = findParent(
                component,
                (p) => p.noodlType === 'listItem',
              )
              const dataObject = listItemComponent.getDataObject()
              return dataObject.fruit + dataObject.ext
            },
            trigger: 'path',
          })
          // noodlui.resolveComponents(view)
          expect(noodlui.createSrc(path, image)).to.eq(
            noodlui.assetsUrl + 'apple.png',
          )
        })
      })

      describe('when not providing a component', () => {
        it('should work for passing emit objects', () => {
          const iteratorVar = 'hello'
          const path = {
            emit: {
              dataKey: {
                var1: iteratorVar,
              },
              actions: [
                {
                  if: [() => false, {}, {}],
                },
              ],
            },
          }
          const view = createComponent('view')
          const listItem = new ListItem()
          listItem.setDataObject({ fruit: 'apple', ext: '.png' })
          const image = createComponent('image')
          image.set('path', path)
          view.createChild(listItem)
          listItem.createChild(image)
          // @ts-expect-error
          noodlui.use({
            actionType: 'emit',
            fn: (path, component) => {
              const listItemComponent = findParent(
                component,
                (p) => p.noodlType === 'listItem',
              )
              const dataObject = listItemComponent.getDataObject()
              return dataObject.fruit + dataObject.ext
            },
            trigger: 'path',
          })
          // noodlui.resolveComponents(view)
          expect(noodlui.createSrc(path, image)).to.eq(
            noodlui.assetsUrl + 'apple.png',
          )
        })
      })
    })

    it('should try to use a data object to pass to the if func if component is provided', () => {
      const path = {
        if: [(o: any) => o.gender === 'Male', 'male.png', 'female.png'],
      } as any
      const listItem = new ListItem() as any
      listItem.setDataObject({ gender: 'Female' })
      expect(noodlui.createSrc(path, listItem)).to.eq(
        noodlui.assetsUrl + 'female.png',
      )
      const image = new Component({ type: 'image' })
      listItem.createChild(image)
      expect(noodlui.createSrc(path, image as any)).to.eq(
        noodlui.assetsUrl + 'female.png',
      )
    })
  })

  describe('when using getters', () => {
    it('should return the resolver context', () => {
      expect(noodlui.getContext()).to.have.keys([
        'assetsUrl',
        'page',
        'roots',
        'viewport',
      ])
    })

    it('should return all consumer options', () => {
      expect(noodlui.getConsumerOptions({} as any)).to.have.keys([
        'component',
        'context',
        'createActionChainHandler',
        'createSrc',
        'getNode',
        'getNodes',
        'getPageObject',
        'getState',
        'parser',
        'resolveComponent',
        'setNode',
        'showDataKey',
      ])
    })

    describe('getNodes', () => {
      xit('should return an object of component nodes where key is component id and value is the instance', () => {
        // console.info(noodlui.getNodes())
      })
    })

    describe('getNode', () => {
      xit('should return the component instance', () => {
        //
      })
    })
  })

  describe('when using setters', () => {
    it('should set the assets url', () => {
      const prevAssetsUrl = noodlui.assetsUrl
      noodlui.setAssetsUrl('https://google.com')
      expect(noodlui.assetsUrl).to.not.equal(prevAssetsUrl)
    })

    it('should set the page', () => {
      const pageName = 'Loopa'
      const pageObject = { module: 'paper', components: [] }
      noodlui.setRoot(pageName, pageObject)
      expect(noodlui.page).to.equal('')
      noodlui.setPage(pageName)
      expect(noodlui.page).to.equal(pageName)
      expect(noodlui.getPageObject(pageName)).to.equal(pageObject)
    })

    it('should set the root', () => {
      const pageName = 'Loopa'
      const pageObject = { module: 'paper', components: [] }
      expect(noodlui.root).to.not.have.property(pageName, pageObject)
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
      const component = new Component({ type: 'list' })
      expect(noodlui.getNode(component)).to.be.null
      noodlui.setNode(component)
      expect(noodlui.getNode(component)).to.equal(component)
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
      })
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

    xit('should pass the trigger prop to actionChain.build', () => {
      //
    })

    xit('should pass in the resolver context', () => {
      //
    })
  })
})
