import { expect } from 'chai'
import chalk from 'chalk'
import sinon from 'sinon'
import userEvent from '@testing-library/user-event'
import { noodlui } from '../utils/test-utils'
import makeRootsParser from '../factories/makeRootsParser'
import ActionChain from '../ActionChain'
import Action from '../Action'
import {
  UpdateActionObject,
  PageJumpObject,
  PopupDismissObject,
  IAction,
  IComponentTypeInstance,
  ResolverContext,
  IList,
  IListItem,
  EmitActionObject,
} from '../types'
import List from '../components/List'
import * as helpers from './helpers'
import {
  actionChainEmitTriggers,
  actionTypes,
  emitTriggers,
  resolveEmitTriggers,
} from '../constants'
import createComponent from '../utils/createComponent'
import { waitFor } from '@testing-library/dom'
import EmitAction from '../Action/EmitAction'
import Component from '../components/Base'

const parser = makeRootsParser({ root: {} })

const pageJumpAction: PageJumpObject = {
  actionType: 'pageJump',
  destination: 'MeetingRoomCreate',
}

const popUpDismissAction: PopupDismissObject = {
  actionType: 'popUpDismiss',
  popUpView: 'warningView',
}

const updateObjectAction: UpdateActionObject = {
  actionType: 'updateObject',
  object: {
    '.Global.meetroom.edge.refid@': '___.itemObject.id',
  },
}

let actions: [PopupDismissObject, UpdateActionObject, PageJumpObject]

let actionChain: ActionChain<any[], IComponentTypeInstance>

beforeEach(() => {
  actions = [popUpDismissAction, updateObjectAction, pageJumpAction]
  actionChain = new ActionChain(actions, {} as any)
})

describe('ActionChain', () => {
  describe('when adding actions', () => {
    it('should set the builtIns either by using a single object or an array', () => {
      const mockBuiltInFn = sinon.spy()
      const component = createComponent('view')
      actionChain = new ActionChain(
        [popUpDismissAction, updateObjectAction, pageJumpAction],
        { component, trigger: 'onClick' },
      )
      expect(actionChain.fns.builtIn).not.to.have.property('hello')
      expect(actionChain.fns.builtIn).not.to.have.property('hi')
      expect(actionChain.fns.builtIn).not.to.have.property('monster')
      expect(actionChain.fns.builtIn).not.to.have.property('dopple')
      actionChain.useBuiltIn({ funcName: 'hello', fn: mockBuiltInFn })
      expect(actionChain.fns.builtIn)
        .to.have.property('hello')
        .that.includes(mockBuiltInFn)
      actionChain.useBuiltIn({ funcName: 'lion', fn: [mockBuiltInFn] })
      expect(actionChain.fns.builtIn)
        .to.have.property('lion')
        .that.includes(mockBuiltInFn)
      actionChain.useBuiltIn([{ funcName: 'hi', fn: mockBuiltInFn }])
      expect(actionChain.fns.builtIn)
        .to.have.property('hi')
        .that.includes(mockBuiltInFn)
      actionChain.useBuiltIn([
        {
          funcName: 'monster',
          fn: [mockBuiltInFn, mockBuiltInFn, mockBuiltInFn],
        },
      ])
      expect(actionChain.fns.builtIn)
        .to.have.property('monster')
        .that.is.an('array')
        .that.includes(mockBuiltInFn)
        .with.lengthOf(3)
    })

    it('should populate the action array with the raw action objects', () => {
      const actionChain = new ActionChain(
        [pageJumpAction, popUpDismissAction],
        { component: createComponent('textField'), trigger: 'onClick' },
      )
      expect(actionChain.actions).to.include.deep.members([
        pageJumpAction,
        popUpDismissAction,
      ])
    })

    it('should load up the action fns', () => {
      const actionChain = new ActionChain(actions, {} as any)
      const popup = sinon.spy()
      const update = sinon.spy()
      const popupObj = { actionType: 'popUp', fn: [popup] }
      const updateObj = { actionType: 'updateObject', fn: [update] }
      actionChain.useAction(popupObj)
      actionChain.useAction([updateObj])
      expect(actionChain.fns.action).to.have.property('popUp')
      expect(actionChain.fns.action.popUp).to.be.an('array')
      expect(actionChain.fns.action.popUp?.[0].fn?.[0]).to.eq(popup)
      expect(actionChain.fns.action.updateObject).to.have.lengthOf(1)
      expect(actionChain.fns.action).to.have.property('updateObject')
      expect(actionChain.fns.action.updateObject).to.be.an('array')
      expect(actionChain.fns.action.updateObject?.[0].fn?.[0]).to.eq(update)
      expect(actionChain.fns.action.updateObject).to.have.lengthOf(1)
    })

    it(
      'should forward the built ins to useBuiltIn if any builtIn objects ' +
        'were passed in',
      () => {
        //
      },
    )
  })

  describe('when creating actions', () => {
    xit('should treat the noodl anonymous object as an action with actionType: "anonymous"', () => {
      //
    })

    xit('should treat the noodl emit object as an action with actionType: "emit"', () => {
      //
    })

    actionTypes.forEach((actionType) => {
      it(
        `should return an action instance when registering the ` +
          `${chalk.yellow(actionType)} action`,
        () => {
          expect(
            actionChain.createAction({
              actionType,
              fn: sinon.spy(),
              trigger: 'onClick',
              context: { noodl: 'hello' },
            }),
          ).to.be.instanceOf(Action)
        },
      )
    })
  })

  describe('when building the action chain handler', () => {
    it('should load up the queue', () => {
      const view = createComponent('view') as IComponentTypeInstance
      const actionChain = new ActionChain(
        [
          { actionType: 'builtIn', funcName: 'hello', fn: sinon.spy() },
          { emit: { dataKey: { var1: 'itemObject' }, actions: [{}, {}, {}] } },
        ],
        { component: view, trigger: 'onClick' },
      )
      actionChain.useAction([
        { actionType: 'builtIn', funcName: 'hello', fn: sinon.spy() },
        {
          actionType: 'emit',
          fn: sinon.spy(() => Promise.resolve()),
          context: {},
          trigger: 'onClick',
        },
      ])
      actionChain.build()
      const queue = actionChain.getQueue()
      expect(queue).to.have.lengthOf(2)
      expect(queue[0]).to.be.instanceOf(Action)
      expect(queue[1]).to.be.instanceOf(Action)
    })

    it('should be an EmitAction subclass instance for emit actions', () => {
      const component = createComponent('view')
      const actionChain = new ActionChain(
        [{ emit: { dataKey: { var1: 'itemObject' }, actions: [] } }],
        { component, trigger: 'onClick' } as any,
      )
      actionChain.build()
      expect(actionChain.getQueue()[0]).to.be.instanceOf(EmitAction)
    })

    it('should load up the number of items in the queue correctly', async () => {
      const spy = sinon.spy()
      const emitUseObj = { actionType: 'emit', fn: spy, trigger: 'onChange' }
      const component = createComponent('textField')
      const actionChain = new ActionChain(
        [{ emit: { dataKey: { var1: 'itemObject' }, actions: [] } }],
        { component, trigger: 'onClick' } as any,
      )
      actionChain.useAction(emitUseObj)
      expect(actionChain.getQueue()).to.have.lengthOf(0)
      const handler = actionChain.build()
      expect(actionChain.getQueue()).to.have.lengthOf(1)
      await handler()
      expect(actionChain.getQueue()).to.have.lengthOf(1)
      await handler()
      await handler()
      await handler()
      expect(actionChain.getQueue()).to.have.lengthOf(1)
    })

    it('should call the fn registered with the "use" action object', async () => {
      const emitSpy = sinon.spy()
      const builtInSpy = sinon.spy()
      const pageJumpSpy = sinon.spy()
      const component = createComponent('image')
      const actionChain = new ActionChain(
        [
          pageJumpAction,
          { emit: { dataKey: { var1: 'itemObject' }, actions: [] } },
          { actionType: 'builtIn', funcName: 'hello' },
        ],
        { component, trigger: 'onClick' } as any,
      )
      actionChain.useAction({
        actionType: 'emit',
        fn: emitSpy,
        trigger: 'onClick',
      })
      actionChain.useAction([
        { actionType: 'pageJump', fn: pageJumpSpy },
        { actionType: 'builtIn', funcName: 'hello', fn: builtInSpy },
      ])
      const handler = actionChain.build()
      await handler()
      expect(emitSpy.called).to.be.true
      expect(builtInSpy.called).to.be.true
      expect(pageJumpSpy.called).to.be.true
    })

    it('should not handle onClick emit handlers if triggered by onChange', async () => {
      const mockEmitFn = sinon.spy()
      const mockEmitObj = {
        emit: { dataKey: { var1: 'itemObject' }, actions: [{}, {}, {}] },
      }
      const actionChain = new ActionChain(
        [mockEmitObj] as any,
        { component: createComponent('view'), trigger: 'onClick' } as any,
      )
      actionChain.useAction([
        {
          actionType: 'emit',
          context: { noodl: {} },
          fn: mockEmitFn,
          trigger: 'onChange',
        },
      ])
      const execute = actionChain.build()
      await execute()
      expect(mockEmitFn.called).to.be.false
    })

    it('should not handle onChange emit handlers if triggered by onClick', async () => {
      const mockEmitFn = sinon.spy()
      const mockEmitObj = {
        emit: { dataKey: { var1: 'itemObject' }, actions: [{}, {}, {}] },
      }
      const actionChain = new ActionChain(
        [mockEmitObj] as any,
        { component: createComponent('view'), trigger: 'onClick' } as any,
      ).useAction([
        {
          actionType: 'emit',
          context: { noodl: {} },
          fn: mockEmitFn,
          trigger: 'onChange',
        },
      ])
      const execute = actionChain.build()
      await execute()
      expect(mockEmitFn.called).to.be.false
    })

    it('should pass the correct base essental args to the executor', async () => {
      const spy = sinon.spy()
      const emitUseObj = { actionType: 'emit', fn: spy, trigger: 'onChange' }
      const component = createComponent('textField')
      const actionChain = new ActionChain(
        [{ emit: { dataKey: { var1: 'itemObject' }, actions: [] } }],
        { component, trigger: 'onChange' } as any,
      )
      actionChain.useAction(emitUseObj)
      const handler = actionChain.build()
      await handler()
      const optionsArg = spy.args[0][1]
      expect(optionsArg).to.have.property('event')
      expect(optionsArg).to.have.property('actions')
      expect(optionsArg).to.have.property('component')
      expect(optionsArg).to.have.property('pageName')
      expect(optionsArg).to.have.property('pageObject')
      expect(optionsArg).to.have.property('queue')
      expect(optionsArg).to.have.property('snapshot')
      expect(optionsArg).to.have.property('status')
    })

    it(`should return a function`, () => {
      const actionChain = new ActionChain(
        [{ actionType: 'builtIn', funcName: 'hello', fn: sinon.spy() }],
        { component: {} } as any,
      )
      expect(actionChain.build()).to.be.a('function')
    })
  })

  describe('when running actions', () => {
    it('should run the actions when calling the builded function', async () => {
      const mockBuiltInFn = sinon.spy()
      const mockEmitFn = sinon.spy()
      const mockEmitObj = {
        emit: { dataKey: { var1: 'itemObject' }, actions: [{}, {}, {}] },
      }
      const mockBuiltInObj = { actionType: 'builtIn', funcName: 'hello' }
      const actionChain = new ActionChain(
        [mockEmitObj, mockBuiltInObj] as any,
        { component: createComponent('view'), trigger: 'onClick' } as any,
      )
      actionChain.useAction([
        {
          actionType: 'emit',
          context: { noodl: {} },
          fn: mockEmitFn,
          trigger: 'onClick',
        },
        { actionType: 'builtIn', funcName: 'hello', fn: mockBuiltInFn },
      ])
      const execute = actionChain.build()
      await execute()
      expect(mockBuiltInFn.called).to.be.true
      expect(mockEmitFn.called).to.be.true
    })

    it(
      'should call the builtIn funcs that were registered by their funcName ' +
        'when being run',
      async () => {
        const actionChain = new ActionChain(
          [...actions, { actionType: 'builtIn', funcName: 'red' }],
          {} as any,
        )
        const spy = sinon.spy()
        actionChain.useBuiltIn({ funcName: 'red', fn: spy })
        const func = actionChain.build({} as any)
        await func()
        expect(spy.called).to.be.true
      },
    )

    it(
      'should call the non-builtIn funcs that were registered by actionType ' +
        'when being run',
      async () => {
        const component = createComponent('view')
        const popupSpy = sinon.spy()
        const gotoSpy = sinon.spy()
        const emitSpy = sinon.spy()
        const updateObjectSpy = sinon.spy()
        const saveObjectSpy = sinon.spy()
        const evalObjectSpy = sinon.spy()
        const actionChain = new ActionChain(
          [
            { actionType: 'popUpDismiss' },
            { goto: 'https://www.google.com' },
            { emit: { dataKey: { var1: 'hello' }, actions: [] } },
            { actionType: 'updateObject', object: () => {} },
            { actionType: 'saveObject' },
            { actionType: 'evalObject' },
          ],
          { component, trigger: 'onClick' },
        )
        actionChain.useAction({ actionType: 'popUpDismiss', fn: popupSpy })
        actionChain.useAction({ actionType: 'goto', fn: gotoSpy })
        actionChain.useAction({
          actionType: 'updateObject',
          fn: updateObjectSpy,
        })
        actionChain.useAction([
          { actionType: 'emit', fn: emitSpy, trigger: 'onClick' },
          { actionType: 'saveObject', fn: saveObjectSpy },
          { actionType: 'evalObject', fn: evalObjectSpy },
        ])
        const func = actionChain.build()
        await func()
        expect(popupSpy.called).to.be.true
        expect(gotoSpy.called).to.be.true
        expect(emitSpy.called).to.be.true
        // expect(updateObjectSpy.called).to.be.true
        // expect(saveObjectSpy.called).to.be.true
        // expect(evalObjectSpy.called).to.be.true
      },
    )

    it('should pass in the anonymous func into the anonymous action callback', async () => {
      const spy = sinon.spy()
      const component = new List() as IComponentTypeInstance
      const actionChain = new ActionChain(
        [pageJumpAction, { actionType: 'anonymous', fn: spy }],
        { component },
      )
      const execute = actionChain.build({ trigger: 'onClick' } as any)
      await execute()
      expect(spy.firstCall.args[0].original)
        .to.have.property('fn')
        .that.is.a('function')
    })

    it('should receive the component in callback options', async () => {
      const spy = sinon.spy()
      const component = new List() as IComponentTypeInstance
      const actionChain = new ActionChain(
        [{ actionType: 'anonymous', fn: spy }],
        { component },
      )
      const execute = actionChain.build({
        context: {} as ResolverContext,
        trigger: 'onClick',
      })
      await execute({})
      expect(spy.called).to.be.true
      expect(spy.firstCall.args[1])
        .to.have.property('component')
        .that.is.equal(component)
    })
  })

  it('should update the "status" property when starting the action chain', () => {
    const actionChain = new ActionChain([pageJumpAction], {} as any)
    const btn = document.createElement('button')
    btn.addEventListener('click', async (args) => {
      const fn = actionChain.build({ parser } as any)
      await fn(args)
      return expect(actionChain.status).to.eq('done')
    })
    expect(actionChain.status).to.equal(null)
    btn.click()
    expect(actionChain.status).to.equal('in.progress')
  })

  xit(
    'the status should be an object with an "aborted" property after ' +
      'explicitly calling "abort"',
    async () => {
      const spy = sinon.spy()
      const actionChain = new ActionChain([pageJumpAction], {
        pageJump: spy,
      })
      expect(actionChain.status).to.be.null
      const btn = document.createElement('button')
      const handler = () => {
        try {
          actionChain.abort()
        } catch (error) {}
      }
      btn.addEventListener('click', handler)
      btn.click()
      btn.removeEventListener('click', handler)
      expect(actionChain.status).to.have.property('aborted')
    },
  )

  xit('calling abort should clear the queue', async () => {
    const component = createComponent('view')
    const actionChain = new ActionChain(
      [pageJumpAction, popUpDismissAction, updateObjectAction],
      { component, trigger: 'onClick' },
    )
    const handler = actionChain.build()
    const queue = actionChain.getQueue()
  })

  xit('should show a different abort reason if it happened somewhere else', () => {
    //
  })

  xit('skipped actions should have the status "aborted" with some "unregistered callback" reason', () => {
    //
  })

  it('should load the queue', () => {
    const mockAnonFn = sinon.spy(() => 'abc')
    const component = new List()
    const actionChain = new ActionChain(
      [
        sinon.spy(),
        { emit: { dataKey: { var1: 'h' }, actions: [] } },
        { actionType: 'popUpDismiss' },
      ],
      { component, trigger: 'onClick' },
    )
    actionChain.useAction({ actionType: 'anonymous', fn: mockAnonFn })
    actionChain.loadQueue()
    const queue = actionChain.getQueue()
    expect(queue.length).to.eq(3)
    expect(queue[0]).to.be.instanceOf(Action)
    expect(queue[1]).to.be.instanceOf(EmitAction)
    expect(queue[2]).to.be.instanceOf(Action)
    expect(queue[0].actionType).to.eq('anonymous')
  })

  describe("when calling an action's 'execute' method", () => {
    it('actions should have been executed when the action chain was run', async () => {
      const component = createComponent('video')
      const actions = [
        pageJumpAction,
        popUpDismissAction,
        { emit: { dataKey: { var1: 'f' }, actions: [] } },
        sinon.spy(),
      ]
      const actionChain = new ActionChain(actions, {
        component,
        trigger: 'onClick',
      })
      const fn = actionChain.build()
      const queue = actionChain.getQueue()
      await fn()
      queue.forEach((action) => {
        expect(action.executed).to.be.true
      })
    })

    it('should call the "execute" method', async () => {
      const func = () => 'hello'
      const component = new List()
      const actionChain = new ActionChain([func], {
        component,
        trigger: 'onClick',
      })
      const executeSpy = sinon.spy(actionChain, 'execute')
      const handler = actionChain.build()
      await handler()
      expect(executeSpy.called).to.be.true
    })

    it('the execute method should return something', async () => {
      const func = () => 'hello'
      const component = new List()
      const actionChain = new ActionChain([func], {
        component,
        trigger: 'onClick',
      })
      actionChain.useAction({
        actionType: 'anonymous',
        fn: async () => 'hifafs',
      })
      const executeSpy = sinon.spy(actionChain, 'execute')
      const handler = actionChain.build()
      await handler()
      const returnValue = await executeSpy.returnValues
      console.info('returnValue', returnValue)
      expect(executeSpy.called).to.be.true
    })

    it('should pass the component instance to args', async () => {
      const mockAnonFn = sinon.spy()
      const component = new List()
      const actionChain = new ActionChain([mockAnonFn], {
        component,
        trigger: 'onClick',
      })
      const handler = actionChain.build()
      await handler()
      expect(mockAnonFn.called).to.be.true
      expect(mockAnonFn.firstCall.args[1])
        .to.have.property('component')
        .that.is.eq(component)
    })

    xit('should pass actions context to emit actions', () => {
      //
    })

    describe('if the caller returned a string', () => {
      //
    })

    describe('if the caller returned a function', () => {
      //
    })

    describe('if the caller returned an object', () => {
      xit('should inject the result to the beginning of the queue if the result is an action noodl object', () => {
        //
      })

      xit('should add the object to the "intermediary" list if the returned result was an action noodl object', () => {
        //
      })
    })

    describe('if the caller called the "abort" callback', () => {
      //
    })

    describe('when executing emit actions', () => {
      let page: any
      let view: IComponentTypeInstance
      let list: IList
      let image: IComponentTypeInstance
      let textField: IComponentTypeInstance
      let originalPage: any
      let generalInfoTemp: { gender: { key: string; value: any } }
      let mockOnClickEmitCallback: sinon.SinonSpy
      let mockOnChangeEmitCallback: sinon.SinonSpy
      let mockPathEmitCallback: sinon.SinonSpy
      let pathEmit = {
        emit: {
          dataKey: {
            var: 'generalInfoTemp',
          },
          actions: [
            {
              if: [
                {
                  '=.builtIn.object.has': {
                    dataIn: {
                      object: '..generalInfoTemp.gender',
                      key: '$var.key',
                    },
                  },
                },
                'selectOn.png',
                'selectOff.png',
              ],
            },
          ],
        },
      } as any
      let onChangeEmit = {
        emit: {
          dataKey: {
            var: 'itemObject',
          },
          actions: [
            {
              '=.builtIn.object.set': {
                dataIn: {
                  object: '..generalInfoTemp',
                  key: '$var.key',
                  value: '$var.input',
                },
              },
            },
          ],
        },
      } as any

      beforeEach(() => {
        generalInfoTemp = {
          gender: [
            {
              key: 'male',
              value: 'Male',
            },
            {
              key: 'female',
              value: 'Female',
            },
            {
              key: 'other',
              value: 'Other',
            },
          ],
        }
        mockOnClickEmitCallback = sinon.spy(() => 'abc.png')
        mockOnChangeEmitCallback = sinon.spy()
        mockPathEmitCallback = sinon.spy(() => 'fruit.png')
        noodlui
          .setRoot('PatientChartGeneralInfo', { generalInfoTemp })
          .setPage('PatientChartGeneralInfo')
        noodlui.use([
          {
            actionType: 'emit',
            fn: mockOnClickEmitCallback,
            trigger: 'onClick',
          },
          {
            actionType: 'emit',
            fn: mockOnChangeEmitCallback,
            trigger: 'onChange',
          },
          {
            actionType: 'emit',
            fn: mockPathEmitCallback,
            trigger: 'path',
          },
        ] as any)
        page = {
          PatientChartGeneralInfo: {
            generalInfoTemp,
            components: [
              {
                type: 'view',
                viewTag: 'genderTag',
                children: [
                  {
                    type: 'image',
                    path: pathEmit,
                    onClick: [
                      {
                        emit: {
                          dataKey: { var: 'generalInfoTemp' },
                          actions: [{ if: [{}, {}, {}] }],
                        },
                      } as any,
                      {
                        actionType: 'builtIn',
                        funcName: 'redraw',
                        viewTag: 'genderTag',
                      },
                    ],
                  },
                  {
                    type: 'textField',
                    style: { width: '0.4', height: '0.03' },
                    placeholder: 'Enter',
                    dataKey: 'itemObject.input',
                    onChange: onChangeEmit,
                  },
                ],
              },
            ],
          },
        }
        // originalPage = page.originalPage
        // view = page.components[0]
        // image = view.child() as any
        // textField = view.child(1) as any
      })

      xit('should populate dataObject in the instance', () => {
        //
      })

      xit('should populate the dataKey(s)', () => {
        //
      })

      xit('should populate the iteratorVar if the component is a list consumer', () => {
        //
      })

      xit('should populate the trigger', () => {
        //
      })

      describe('when emitting for list consumers', () => {
        it(
          'should populate the EmitAction instance with dataKey, iteratorVar, ' +
            'and the dataObject',
          async () => {
            const listObject = [
              { gender: { value: 'Male' } },
              { gender: { value: 'Female' } },
            ]
            const iteratorVar = 'abc'
            const emitSpy = sinon.spy()
            const list = createComponent('list') as IList
            const listItem = createComponent('listItem') as IListItem
            const textField = createComponent({
              type: 'textField',
              dataKey: 'gender.value',
              onChange: [
                {
                  emit: {
                    dataKey: iteratorVar + '.gender.value',
                    actions: [{}, {}, {}],
                  },
                },
              ],
            })
            list
              .set('iteratorVar', iteratorVar)
              .set('listObject', listObject)
              .set('listId', 'mylistid')
            listItem
              .set('iteratorVar', iteratorVar)
              .set('listIndex', 0)
              .set('listId', 'mylistid')
              .setDataObject(listObject[0])
            textField
              .set('iteratorVar', iteratorVar)
              .set('listIndex', 0)
              .set('listId', 'mylistid')
            list.createChild(listItem)
            listItem.createChild(textField)
            listItem.setDataObject(listObject[0])
            const actionChain = new ActionChain(
              [
                pageJumpAction,
                {
                  emit: { dataKey: iteratorVar + '.gender.value', actions: [] },
                },
              ],
              { component: textField, trigger: 'onChange' },
            )
            actionChain.useAction({
              actionType: 'emit',
              fn: emitSpy,
              trigger: 'onChange',
            })
            const handler = actionChain.build()
            await handler()
            const arg = emitSpy.args[0][0]
            expect(arg).to.be.instanceOf(EmitAction)
            expect(arg.dataKey).to.eq(iteratorVar + '.gender.value')
            expect(arg.iteratorVar).to.eq(iteratorVar)
            expect(arg.getDataObject()).to.eq(listObject[0])
          },
        )
      })

      it.only('should be able to access a dataObject coming from the root', async () => {
        const pageObject = { gender: { value: 'Male' } }
        const emitSpy = sinon.spy()
        const image = createComponent({
          type: 'image',
          path: 'Male.png',
          onClick: [
            {
              emit: {
                dataKey: 'gender.value',
                actions: [{}, {}, {}],
              },
            },
          ],
        })
        const actionChain = new ActionChain(
          [pageJumpAction, { emit: { dataKey: 'gender.value', actions: [] } }],
          {
            component: image,
            trigger: 'onClick',
            pageName: 'Hello',
            pageObject,
          },
        )
        actionChain.useAction({
          actionType: 'emit',
          fn: emitSpy,
          trigger: 'onClick',
        })
        const handler = actionChain.build()
        const results = await handler()
        console.info(results)
        const arg = emitSpy.args[0][0]
        expect(arg).to.be.instanceOf(EmitAction)
        expect(arg.dataKey).to.eq('gender.value')
        expect(arg.getDataObject()).to.eq('Male')
      })

      xit('should be able to access a dataObject coming from the local root', () => {
        //
      })

      xit('should be able to access the dataObject coming from a list', () => {
        //
      })

      xit('the dataObject passed to emit action should be in the args', () => {
        const listItem = list.child() as IListItem
        const image = listItem.child(1)
        expect(listItem.getDataObject()).to.eq(image?.get('dataObject'))
      })

      it('should have a trigger value of "onClick" if triggered by an onClick', async () => {
        const emitSpy = sinon.spy()
        const image = createComponent('image')
        const actionChain = new ActionChain(
          [{ emit: { dataKey: 'f', actions: [] } }],
          { component: image, trigger: 'onClick' },
        )
        actionChain.useAction({
          actionType: 'emit',
          trigger: 'onClick',
          fn: emitSpy,
        })
        const handler = actionChain.build()
        await handler()
        expect(emitSpy.firstCall.args[0]).to.have.property('trigger', 'onClick')
      })

      actionChainEmitTriggers.forEach((trigger) => {
        const onChangeEmitObj = {
          emit: {
            dataKey: { var: 'itemObject' },
            actions: [{ '=.builtIn.object.set': { dataIn: {} } }],
          },
        } as any
        const onClickEmitObj = {
          emit: {
            dataKey: { var: 'itemObject' },
            actions: [{}, {}, {}],
          },
        }
        const createTextField = () =>
          createComponent({
            type: 'textField',
            onChange: onChangeEmitObj,
            onClick: onClickEmitObj,
            placeholder: 'Enter',
            dataKey: 'itemObject.input',
          }) as IComponentTypeInstance
      })

      describe('when using onChange emit', () => {
        it('should have a trigger value of "onChange" if triggered by an onChange', async () => {
          const onChangeEmitObj = {
            emit: { dataKey: { var1: 'itemObject' }, actions: [] },
          }
          const emitSpy = sinon.spy()
          const textField = createComponent({
            type: 'textField',
            onChange: onChangeEmitObj,
            placeholder: 'Enter',
            dataKey: 'itemObject.input',
          }) as IComponentTypeInstance
          const actionChain = new ActionChain([onChangeEmitObj], {
            component: textField,
            trigger: 'onChange',
          })
          actionChain.useAction({
            actionType: 'emit',
            fn: emitSpy,
            trigger: 'onChange',
          })
          const handler = actionChain.build()
          await handler()
          expect(emitSpy.called).to.be.true
          expect(emitSpy.firstCall.args[0]).to.have.property(
            'trigger',
            'onChange',
          )
        })
      })
    })
  })

  describe('when action chains finish', () => {
    it('should refresh after done running', async () => {
      const component = createComponent('textField')
      const spy = sinon.spy()
      const actionChain = new ActionChain(
        [
          pageJumpAction,
          popUpDismissAction,
          { emit: { dataKey: 'hello', actions: [] } },
        ],
        { component, trigger: 'onClick' },
      )
      actionChain.useAction([
        { actionType: 'pageJump', fn: spy },
        { actionType: 'popUpDismiss', fn: spy },
        { actionType: 'emit', fn: spy, trigger: 'onClick' },
      ])
      const onClick = actionChain.build()
      const queue = actionChain.getQueue().slice()
      queue.forEach((action) => {
        expect(action.executed).to.be.false
      })
      await onClick({})
      queue.forEach((action) => {
        expect(action.executed).to.be.true
      })
      actionChain.getQueue().forEach((action) => {
        expect(action.executed).to.be.false
      })
    })
  })
})
