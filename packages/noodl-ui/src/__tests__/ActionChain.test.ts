import { expect } from 'chai'
import chalk from 'chalk'
import sinon from 'sinon'
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
} from '../types'
import List from '../components/List'
import * as helpers from './helpers/helpers'
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

    it('should set the actions', () => {
      const actionChain = new ActionChain(actions, {} as any)
      const popup = sinon.spy()
      const update = sinon.spy()
      const popupObj = { actionType: 'popUp', fn: [popup] }
      const updateObj = { actionType: 'updateObject', fn: update }
      actionChain.useAction(popupObj)
      actionChain.useAction([updateObj])
      expect(actionChain.fns.action).to.have.property('popUp')
      expect(actionChain.fns.action.popUp)
        .to.be.an('array')
        .that.includes(popup)
      expect(actionChain.fns.action.updateObject).to.have.lengthOf(1)
      expect(actionChain.fns.action).to.have.property('updateObject')
      expect(actionChain.fns.action.updateObject)
        .to.be.an('array')
        .that.includes(update)
      expect(actionChain.fns.action.updateObject).to.have.lengthOf(1)
    })

    xit(
      'should forward the built ins to useBuiltIn if any builtIn objects ' +
        'were passed in',
      () => {
        //
      },
    )
  })

  describe('when creating actions', () => {
    it('should return an action instance when registering builtIn objects', () => {
      expect(
        actionChain.createAction({ actionType: 'builtIn', funcName: 'hello' }),
      ).to.be.instanceOf(Action)
    })

    it(
      'should return an action instance when registering custom objects ' +
        '(non builtIns)',
      () => {
        expect(
          actionChain.createAction({
            actionType: 'pageJump',
            destination: 'hello',
          }),
        ).to.be.instanceOf(Action)
      },
    )
  })

  describe('when running actions', () => {
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
      let view: IComponentTypeInstance
      let list: IList
      let originalPage: any
      let listObject: { key: string; value: string }[]
      const iteratorVar = 'hello'
      const viewTag = 'pastMedicalHistoryTag'
      let mockEmitCallback: sinon.SinonSpy
      let mockPathEmitCallback: sinon.SinonSpy

      beforeEach(() => {
        mockEmitCallback = sinon.spy()
        mockPathEmitCallback = sinon.spy()
        noodlui.use([
          { actionType: 'emit', fn: mockEmitCallback },
          { actionType: 'emit', fn: mockPathEmitCallback, trigger: 'path' },
        ])
        listObject = [
          { key: 'Gender', value: '' },
          { key: 'Gender', value: 'Male' },
          { key: 'Gender', value: 'Female' },
        ]
        const res = helpers.createPage(() => ({
          SignIn: {
            generalInfo: { radio: listObject },
            components: [
              {
                type: 'view',
                children: [
                  {
                    type: 'list',
                    listObject,
                    iteratorVar,
                    contentType: 'list',
                    children: [
                      {
                        type: 'listItem',
                        [iteratorVar]: '',
                        viewTag,
                        children: [
                          { type: 'label', dataKey: `${iteratorVar}.value` },
                          helpers.createImage({
                            path: helpers.createEmitObject({
                              dataKey: { var1: iteratorVar },
                              actions: [helpers.createIfObject({}, {}, {})],
                            }),
                            onClick: [
                              helpers.createEmitObject({
                                dataKey: { var1: iteratorVar },
                                actions: [
                                  {
                                    if: [
                                      {
                                        '.builtIn.object.has': [
                                          { object: '..generalInfo.radio' },
                                          { key: 'var1.key' },
                                        ],
                                      },
                                      {
                                        '.builtIn.object.remove': [
                                          { object: '..generalInfo.radio' },
                                          { key: 'var1.key' },
                                        ],
                                      },
                                      {
                                        '.builtIn.object.set': [
                                          { object: '..generalInfo.radio' },
                                          { key: 'var1.key' },
                                          { value: 'var1.value' },
                                        ],
                                      },
                                    ],
                                  },
                                ],
                              }),
                              helpers.createBuiltInObject({
                                funcName: 'redraw',
                                viewTag,
                              }),
                            ] as any,
                          }),
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        }))
        originalPage = res.originalPage
        view = res.components[0]
        list = view.child() as IList
        const listData = list.getData()
        list.set('listObject', [])
        listData.forEach((d) => list.addDataObject(d))
      })

      it('should pass iteratorVar, listItem, and dataObject to args', async () => {
        const listItem = list.child() as IListItem
        const image = listItem?.child(1) as IComponentTypeInstance
        const actionChain = new ActionChain(
          originalPage.SignIn.components[0].children[0].children[0].children[1].onClick,
          { component: image },
        )
        image.get('onClick')({})
        const execute = actionChain.build({ trigger: 'onClick' } as any)
        await execute({})
        const args = mockEmitCallback.firstCall?.args[1] || {}
        expect(args).to.have.property('iteratorVar', iteratorVar)
        expect(args).to.have.property('listItem')
        expect(args).to.have.property('dataObject')
      })

      it('the dataObject passed to emit action should be in the args', () => {
        const listItem = list.child() as IListItem
        const image = listItem.child(1)
        expect(listItem.getDataObject()).to.eq(image?.get('dataObject'))
      })

      it('should have a trigger value of "path" if triggered by a path emit', async () => {
        const spy = sinon.spy()
        noodlui.use({
          actionType: 'emit',
          fn: spy,
          // fn: () => {
          //   console.info('HELOFMSFMJDN')
          //   console.info('HELOFMSFMJDN')
          //   console.info('HELOFMSFMJDN')
          //   console.info('HELOFMSFMJDN')
          //   console.info('HELOFMSFMJDN')
          //   console.info('HELOFMSFMJDN')
          //   console.info('HELOFMSFMJDN')
          // },
          trigger: 'path',
        })
        const listItem = list.child() as IListItem
        const image = listItem.child(1)
        // console.info(spy.getCalls())
        await waitFor(() => {
          expect(spy.called).to.be.true
        })
      })

      xit('should have a trigger value of "click" if triggered by an onClick', () => {
        //
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
