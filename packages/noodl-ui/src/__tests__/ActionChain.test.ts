import { expect } from 'chai'
import chalk from 'chalk'
import sinon from 'sinon'
import userEvent from '@testing-library/user-event'
import { xit } from 'mocha'
import * as builder from 'noodl-building-blocks'
import { noodlui } from '../utils/test-utils'
import makeRootsParser from '../factories/makeRootsParser'
import ActionChain from '../ActionChain'
import Action from '../Action'
import {
  UpdateActionObject,
  PageJumpActionObject,
  PopupDismissActionObject,
  IAction,
  IComponentTypeInstance,
  ResolverContext,
  IList,
  IListItem,
  EmitActionObject,
} from '../types'
import List from '../components/List'
import * as helpers from './helpers/helpers'
import {
  actionChainEmitTriggers,
  actionTypes,
  emitTriggers,
  resolveEmitTriggers,
} from '../constants'
import createComponent from '../utils/createComponent'
import { waitFor } from '@testing-library/dom'

const parser = makeRootsParser({ roots: {} })

const pageJumpAction: PageJumpActionObject = {
  actionType: 'pageJump',
  destination: 'MeetingRoomCreate',
}

const popUpDismissAction: PopupDismissActionObject = {
  actionType: 'popUpDismiss',
  popUpView: 'warningView',
}

const updateObjectAction: UpdateActionObject = {
  actionType: 'updateObject',
  object: {
    '.Global.meetroom.edge.refid@': '___.itemObject.id',
  },
}

let actions: [
  PopupDismissActionObject,
  UpdateActionObject,
  PageJumpActionObject,
]

let actionChain: ActionChain<any[], IComponentTypeInstance>

beforeEach(() => {
  actions = [popUpDismissAction, updateObjectAction, pageJumpAction]
  actionChain = new ActionChain(actions, {} as any)
})

describe('ActionChain', () => {
  describe('when adding actions', () => {
    it('should set the builtIns either by using a single object or an array', () => {
      const mockBuiltInFn = sinon.spy()
      actionChain = new ActionChain(actions, {} as any)
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
        {} as any,
      )
      expect(actionChain.actions).to.include.members([
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

  describe.only('when building the action chain handler', () => {
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
      const queue = actionChain.getQueue()
      expect(queue).to.have.lengthOf(2)
      expect(queue[0]).to.be.instanceOf(Action)
      expect(queue[1]).to.be.instanceOf(Action)
    })

    xit('should be an EmitAction subclass instance for emit actions', () => {
      //
    })

    xit('should pass the correct args to the executor', () => {
      //
    })

    it(`should return a promise`, () => {
      const actionChain = new ActionChain(
        [builder.createBuiltInObject({ funcName: 'hello', fn: sinon.spy() })],
        { component: {} } as any,
      )
      expect(actionChain.build()).to.be.instanceOf(Promise)
    })
  })

  describe('when running actions', () => {
    xit('should run the actions when calling the builded function', async () => {
      const mockBuiltInFn = sinon.spy()
      const mockEmitFn = sinon.spy()
      const mockEmitObj = {
        emit: { dataKey: { var1: 'itemObject' }, actions: [{}, {}, {}] },
      }
      const mockBuiltInObj = { actionType: 'builtIn', funcName: 'hello' }
      const actionChain = new ActionChain(
        [mockEmitObj, mockBuiltInObj] as any,
        { component: {} } as any,
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
        const actionChain = new ActionChain(actions, {} as any)
        const spy = sinon.spy()
        actionChain.useAction({ actionType: 'popUpDismiss', fn: spy })
        const func = actionChain.build({} as any)
        await func()
        expect(spy.called).to.be.true
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

  xit('the status should be an object with an "aborted" property after explicitly calling "abort"', async () => {
    try {
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
    } catch (error) {}
  })

  xit('calling abort should reset the queue', () => {
    const actionChain = new ActionChain(
      [pageJumpAction, popUpDismissAction, updateObjectAction],
      {} as any,
    )
  })

  xit('skipped actions should have the status "aborted" with some "unregistered callback" reason', () => {
    //
  })

  describe("when calling an action's 'execute' method", () => {
    it('should pass the component instance to args', async () => {
      const spy = sinon.spy()
      noodlui.use({ actionType: 'anonymous', fn: spy })
      const component = new List()
      const actionChain = new ActionChain([spy], { component })
      await actionChain.build({} as any)({} as any)
      expect(spy.firstCall.args[1])
        .to.have.property('component')
        .that.is.eq(component)
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
            context: {},
            trigger: 'path',
          },
        ] as any)
        page = helpers.createPage(() => ({
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
        }))
        originalPage = page.originalPage
        view = page.components[0]
        image = view.child() as any
        textField = view.child(1) as any
      })

      it('should pass dataObject to args', async () => {
        await image.get('onClick')()
        noodlui.save('ActionChain.test.json', noodlui.getCbs(), {
          spaces: 2,
        })
        setTimeout(() => {
          console.info(
            `\nemit [ActionChain] was ${
              !mockOnClickEmitCallback.called ? chalk.red('NOT') : ''
            } called\n`,
            mockOnClickEmitCallback.called,
          )
        }, 1000)
        expect(mockOnClickEmitCallback.called).to.be.true
        expect(mockOnClickEmitCallback.firstCall?.args[1]).to.have.property(
          'dataObject',
        )
      })

      xit('should be able to access a dataObject coming from the root', () => {
        //
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

      it('should have a trigger value of "path" if triggered by a path emit', async () => {
        expect(mockPathEmitCallback.firstCall.args[1]).to.have.property(
          'trigger',
          'path',
        )
      })

      it('should have a trigger value of "click" if triggered by an onClick', async () => {
        const listItem = list.child() as IListItem
        const image = listItem?.child(1) as IComponentTypeInstance
        new ActionChain(
          originalPage.SignIn.components[0].children[0].children[0].children[1].onClick,
          { component: image },
        )
        image.get('onClick')({})
        const execute = actionChain.build({ trigger: 'onClick' } as any)
        await execute({})
        expect(mockOnClickEmitCallback.firstCall.args[1]).to.have.property(
          'trigger',
          'onClick',
        )
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

        let mockEmitCallback: sinon.SinonSpy
        let textField: IComponentTypeInstance

        it('should pass the action and the same options args to all emit actions', async () => {
          mockEmitCallback = sinon.spy()
          textField = createTextField()

          const actionChain = new ActionChain(
            [onChangeEmitObj, pageJumpAction, onClickEmitObj],
            { component: textField, trigger },
          )
          actionChain.useAction([
            { actionType: 'emit', fn: [mockEmitCallback], trigger },
          ])
          textField.set(trigger, actionChain.build({} as any))
          const fn = textField.get(trigger)
          await fn()
          expect(mockEmitCallback.callCount).to.eq(1)
        })
      })

      describe('when using onChange emit', () => {
        it('should have a trigger value of "change" if triggered by an onChange', async () => {
          // const mockOnChangeEmit = sinon.spy()
          // const actionChain = new ActionChain([pageJumpAction, onChangeEmit], {
          //   component: textField,
          // })
          // actionChain.useAction({
          //   actionType: 'emit',
          //   fn: mockOnChangeEmit,
          //   trigger: 'onChange',
          // })
          // const execute = actionChain.build({} as any)
          // textField.set('onChange', execute)
          console.info(page)
          console.info(textField.toJS())
          await textField.get('onChange')({})
          expect(mockOnChangeEmitCallback.called).to.be.true
          expect(mockOnChangeEmitCallback.firstCall.args[1]).to.have.property(
            'trigger',
            'onChange',
          )
        })
      })
    })
  })

  describe('when action chains finish', () => {
    it('should refresh after done running', async () => {
      const spy = sinon.spy()
      const actionChain = new ActionChain([pageJumpAction], {} as any)
      const onClick = actionChain
        .useAction([{ actionType: 'pageJump', fn: spy }])
        .build({} as any)
      await onClick({})
      const refreshedAction = actionChain.actions?.[0] as IAction
      const refreshedQueue = actionChain.getQueue()
      expect(refreshedAction.status).to.be.null
      expect(refreshedQueue).to.have.lengthOf(1)
      expect(refreshedQueue[0].status).to.be.null
    })
  })
})
