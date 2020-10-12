// @ts-nocheck
import { expect } from 'chai'
import _ from 'lodash'
import sinon, { SinonSpy } from 'sinon'
import makeComponentResolver from '../factories/makeComponentResolver'
import { getAllResolvers } from '../utils/test-utils'
import {
  ComponentResolver,
  NOODLComponent,
  ResolverOptions,
  ProxiedComponent,
} from '../types'

let componentResolver: ComponentResolver

beforeEach(() => {
  componentResolver = makeComponentResolver({ roots: {} })
})

describe('makeComponentResolver', () => {
  it('should be able to add life cycle listeners as args (string, function)', () => {
    let result = componentResolver.getLifeCycle('onBeforeResolve')
    const fn = sinon.spy()
    expect(componentResolver.getLifeCycle('onBeforeResolve')).to.be.undefined
    componentResolver.addLifecycleListener('onBeforeResolve', fn)
    result = componentResolver.getLifeCycle('onBeforeResolve')
    expect(typeof result).to.equal('function')
  })

  it('should be able to add multiple life cycle listeners in the object form { [name: string]: Function }', () => {
    expect(componentResolver.getLifeCycle('onBeforeResolve')).to.be.undefined
    expect(componentResolver.getLifeCycle('onAfterResolve')).to.be.undefined
    expect(componentResolver.getLifeCycle('onSomethingElse')).to.be.undefined
    componentResolver.addLifecycleListener({
      onBeforeResolve: sinon.spy(),
      onAfterResolve: sinon.spy(),
      onSomethingElse: sinon.spy(),
    })
    expect(_.isFunction(componentResolver.getLifeCycle('onBeforeResolve'))).to
      .be.true
    expect(_.isFunction(componentResolver.getLifeCycle('onAfterResolve'))).to.be
      .true
    expect(_.isFunction(componentResolver.getLifeCycle('onSomethingElse'))).to
      .be.true
  })

  it('should be able to remove life cycle listeners', () => {
    const fn = sinon.spy()
    componentResolver.addLifecycleListener('red', fn)
    expect(_.isFunction(componentResolver.getLifeCycle('red'))).to.be.true
    componentResolver.removeLifeCycleListener('red')
    expect(_.isFunction(componentResolver.getLifeCycle('red'))).to.be.false
  })

  it('should be able to check if a life cycle listener exists in the local store', () => {
    componentResolver.addLifecycleListener('red', sinon.spy())
    const exists = componentResolver.hasLifeCycle('red')
    expect(exists).to.be.true
  })

  it('should be able to retrieve a life cycle listener', () => {
    const fn = sinon.spy()
    componentResolver.addLifecycleListener('red', fn)
    expect(componentResolver.getLifeCycle('red')).to.equal(fn)
  })

  it('should return the expected resolver options', () => {
    componentResolver.addLifecycleListener('candy', 'sour patches')
    componentResolver.addLifecycleListener({
      fruit: sinon.spy(),
      vegetable: sinon.spy(),
      grain: sinon.spy(),
    })
    expect(_.keys(componentResolver.getResolverOptions())).to.include.members([
      'context',
      'parser',
      'resolveComponent',
      'resolverState',
      'resolvers',
      'fruit',
      'vegetable',
      'grain',
      'candy',
    ])
  })

  it('should return the expected resolver consumer options', () => {
    componentResolver.addLifecycleListener('candy', 'sour patches')
    componentResolver.addLifecycleListener({
      fruit: sinon.spy(),
    })
    expect(
      _.keys(
        componentResolver.getResolverConsumerOptions({
          component: sinon.spy(),
        }),
      ),
    ).to.include.members([
      'createActionChain',
      'component',
      'context',
      'parser',
      'resolverState',
      'resolveComponent',
    ])
  })

  it('should return the resolver state instance', () => {
    const resolverState = componentResolver.getState()
    expect(componentResolver.getState()).to.equal(resolverState)
  })

  it('should return the expected resolver context object', () => {
    const resolverContext = componentResolver.getResolverContext()
    expect(componentResolver.getResolverContext()).to.deep.equal(
      resolverContext,
    )
  })

  it('should be able to retrieve a slice of the state', () => {
    let resolverContext = componentResolver.getResolverContext()
    expect(resolverContext.viewport).empty
    componentResolver.setViewport({ width: 350, height: 250 })
    resolverContext = componentResolver.getResolverContext()
    expect(resolverContext.viewport).to.have.property('width', 350)
    expect(resolverContext.viewport).to.have.property('height', 250)
  })

  it('should be able to add new root objects to the roots object', () => {
    let result
    componentResolver.setRoot({ fruits: 'apple' })
    result = componentResolver.getResolverContext().roots
    expect(result).to.have.property('fruits', 'apple')
    componentResolver.setRoot('fruits', 'oranges')
    result = componentResolver.getResolverContext().roots
    expect(result).to.have.property('fruits', 'oranges')
    componentResolver.setRoot({ fruits: ['abc'], vegetables: 'carrot' })
    result = componentResolver.getResolverContext().roots
    expect(result.fruits).to.deep.equal(['abc'])
    expect(result).to.have.property('vegetables', 'carrot')
  })

  describe('flags', () => {
    xit('should set the "showDataKey" flag correctly', () => {
      //
    })
  })

  describe('resolve', () => {
    let component: NOODLComponent, options: ResolverOptions

    beforeEach(() => {
      component = {
        type: 'label',
        text: 'hello',
        style: { border: { style: '2' } },
        abc: 'hello',
      }
      options = componentResolver.getResolverOptions()
    })

    it('should set the local key', () => {
      componentResolver.setPage({
        name: 'SignIn',
        object: { module: 'patient' },
      })
      componentResolver.resolve(component)
      expect(componentResolver.getParser().getLocalKey()).to.equal('SignIn')
    })

    describe('listeners', () => {
      describe('onBeforeResolve', () => {
        it('should be called', () => {
          const mockOnBeforeResolve = sinon.spy()
          componentResolver.addLifecycleListener({
            onBeforeResolve: mockOnBeforeResolve,
          })
          componentResolver.resolve(component)
          expect(mockOnBeforeResolve.called).to.be.true
        })

        it('should merge the returned props into the proxied component to be included into the resolving process, if provided', () => {
          const mockOnBeforeResolve = sinon.spy(() => ({
            noodl: { fruit: 'apple' },
            style: { border: { style: '5' } },
            viewTag: 'hello',
            abc: 'ab',
          }))
          componentResolver.addLifecycleListener(
            'onBeforeResolve',
            mockOnBeforeResolve,
          )
          const { noodl: noodlProp } = componentResolver.resolve(component)
          expect(mockOnBeforeResolve.called).to.be.true
          expect(noodlProp).to.have.property('fruit', 'apple')
        })
      })

      describe('onAfterResolve', () => {
        it('should be called', () => {
          const mockOnAfterResolve = sinon.spy()
          componentResolver.addLifecycleListener({
            onAfterResolve: mockOnAfterResolve,
          })
          componentResolver.resolve(component)
          expect(mockOnAfterResolve.called).to.be.true
        })
      })

      it('should merge the returned object into the finalized draft if provided', () => {
        const options = [
          { id: 1, key: 1, value: 1 },
          { id: 2, key: 2, value: 2 },
          { id: 3, key: 3, value: 3 },
        ]
        const mockOnAfterResolve = sinon.spy(() => ({
          options,
          text: 'my cool text', // this should be deleted by the deleteUnnecessaryNoodlProps func
          power: 'over',
        }))
        componentResolver.addLifecycleListener({
          onAfterResolve: mockOnAfterResolve,
        })
        const resolvedComponent = componentResolver.resolve(component)
        expect(mockOnAfterResolve.called).to.be.true
        expect(resolvedComponent).to.have.deep.property('options', options)
        expect(resolvedComponent).not.to.have.property('text')
        expect(resolvedComponent).to.have.property('power', 'over')
      })
    })

    describe('custom resolvers', () => {
      it('should call the resolvers', () => {
        const resolver1 = sinon.spy()
        const resolver2 = sinon.spy()
        const resolver3 = sinon.spy()
        const resolvers = [resolver1, resolver2, resolver3]
        componentResolver.addResolvers(resolvers)
        componentResolver.resolve({
          type: 'button',
          text: 'hello',
          style: { borderRadius: '2' },
        })
        _.forEach(resolvers, (resolver: SinonSpy) => {
          expect(resolver.called).to.be.true
        })
      })
    })

    describe('finalizing the draft component', () => {
      let component: ProxiedComponent

      beforeEach(() => {
        component = {
          type: 'view',
          children: [
            {
              type: 'label',
              text: 'hello',
              style: { width: '0.2', height: '0.5' },
            },
          ],
        }
      })

      it('should insert the drafted node into the "drafted" internal store', () => {
        const resolvedComponent = componentResolver.resolve(component)
        const draftedNodes = componentResolver.getDrafted()
        expect(draftedNodes[resolvedComponent.id].id).to.equal(
          resolvedComponent.id,
        )
      })

      it('should omit the "noodl" and "children" property in the inserted drafted node', () => {
        const resolvedComponent = componentResolver.resolve(component)
        const draftedNodes = componentResolver.getDrafted()
        const draftedNode = draftedNodes[resolvedComponent.id]
        expect(draftedNode).not.to.have.property('noodl')
        expect(draftedNode).not.to.have.property('children')
      })
    })
  })

  describe('testing for correct results of resolved components', () => {
    beforeEach(() => {
      componentResolver.addResolvers(getAllResolvers())
    })

    it('should output the expected results for button components', () => {
      const component = {
        type: 'button',
        text: 'hello',
        style: {
          border: { style: '2' },
        },
      }
      const resolvedComponent = componentResolver.resolve(component)
      const { text, style } = resolvedComponent
      expect(resolvedComponent).to.have.property('type', 'button')
      expect(text).to.be.undefined
      expect(style).to.have.property('borderRadius', '0px')
      expect(style).to.have.property('borderStyle', 'none')
      expect(style).to.have.property('borderBottomStyle', 'solid')
      expect(resolvedComponent).not.to.have.property('text')
    })

    it('should output the expected results for image components', () => {
      const component = {
        type: 'image',
        path: 'addMeeting.png',
        onClick: [
          {
            actionType: 'saveObject',
            object: '..save',
          },
          {
            actionType: 'pageJump',
            destination: 'CreateMeeting',
          },
        ],
        style: {
          left: '0.7',
          top: '0.75',
          width: '0.14',
          height: '0.08',
          backgroundColor: '0x388eccff',
          border: {
            style: '5',
          },
          borderRadius: '100',
        },
      }
      const assetsUrl = componentResolver.getAssetsUrl()
      const resolvedComponent = componentResolver.resolve(component)
      const { type, src, onClick, style } = resolvedComponent
      expect(type).to.eq('img')
      expect(src).to.eq(assetsUrl + component.path)
      expect(onClick).to.be.a('function')
      expect(resolvedComponent).not.to.have.property('path')
      expect(_.isPlainObject(style)).to.be.true
      expect(resolvedComponent).to.have.property('noodl')
      const { noodl: noodlProp } = resolvedComponent
      expect(noodlProp).to.have.property('path', component.path)
      expect(noodlProp.onClick).to.deep.eq(component.onClick)
      expect(noodlProp.style)
        .to.be.an('object')
        .that.includes.keys(_.keys(component.style))
      expect(noodlProp.type).to.eq('image')
    })

    // TODO: Wait until we implement the resolveStyles helper (complement to resolveComponent)
    it.skip('should output the expected results for components with a textBoard interface', () => {
      const component = {
        noodl: {},
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
      }
      const resolvedComponent = componentResolver.resolve(component)
      const { children } = resolvedComponent
      expect(children[0].style).to.have.property('color', 'blue')
    })
  })

  describe.skip('resolving children', () => {
    component.createChild({
      type: 'list',
      contentType: 'listObject',
      iteratorVar: 'itemObject',
      listObject: [
        {
          title: 'hello this is my title',
          fruits: ['apple', 'orange'],
          vegetables: ['carrot', 'tomatoes'],
        },
        {
          title: 'hello this is my title#2',
          fruits: ['apple', 'plum'],
          vegetables: ['cilantro', 'spinach'],
        },
      ],
      children: [
        {
          type: 'listItem',
          dataKey: 'loppoo',
          itemObject: '',
          onClick: [
            {
              actionType: 'updateObject',
              dataKey: 'Global.VideoChatObjStore.reference.edge',
              dataObject: 'itemObject',
            },
            {
              actionType: 'pageJump',
              destination: 'VideoChat',
            },
          ],
          style: {
            borderWidth: '1',
            borderColor: '0x00000011',
          },
          children: [
            {
              type: 'label',
              dataKey: 'itemObject.name.hostName',
            },
            {
              type: 'label',
              dataKey: 'itemObject.name.roomName',
              style: { color: '0x000000ff' },
            },
            {
              type: 'view',
              dataKey: 'itemObject.name.roomName',
              style: { color: '0x000000ff' },
              children: [{ type: 'view', style: {}, children: [childInst] }],
            },
            {
              type: 'image',
              path: 'rightArrow.png',
              style: { left: '0.88' },
            },
          ],
        },
      ],
    })
  })
})
