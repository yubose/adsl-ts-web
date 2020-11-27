import { expect } from 'chai'
import chalk from 'chalk'
import sinon from 'sinon'
import { createComponent, EmitAction } from 'noodl-ui'
import { noodlui } from '../utils/test-utils'

beforeEach(() => {
  noodlui.reset({ keepCallbacks: false })
})

describe('actions', () => {
  describe('anonymous', () => {
    xit('should be given the correct args', () => {
      //
    })
  })

  describe('emit', () => {
    describe.only('path', () => {
      it('should have dataKey populated with their values that they are referencing', () => {
        const formData = { password: 'abc', phone: '+1 8882468884' }
        const root = { F: { formData } }
        const emitSpy = sinon.spy()
        const emitObj = { emit: { dataKey: { var1: 'formData' }, actions: [] } }
        const useEmitObj = { actionType: 'emit', fn: emitSpy, trigger: 'path' }
        noodlui
          .setPage('F')
          .use(useEmitObj as any)
          .use({ getRoot: () => root })
          .resolveComponents({ type: 'image', path: emitObj })
        expect(emitSpy.called).to.be.true
        const [action] = emitSpy.args[0] as [EmitAction, any]
        expect(action.dataKey).to.have.property('var1').not.eq('formData')
        expect(action.dataKey).to.have.property('var1').eq(formData)
      })

      xit('should have the iteratorVar in the instance if the component is a list consumer', () => {
        const root = { F: { formData: { password: 'abc' } } }
        const emitSpy = sinon.spy()
        const emitObj = { emit: { dataKey: { var1: 'hello' }, actions: [] } }
        const useEmitObj = { actionType: 'emit', fn: emitSpy, trigger: 'path' }
        noodlui
          .setPage('F')
          .use(useEmitObj)
          .use({ getRoot: () => root })
          .resolveComponents({
            type: 'list',
            iteratorVar: 'f',
            listObject: [{ color: 'red' }],
            children: [{ type: 'image', path: emitObj }],
          })
        const [action] = emitSpy.args[0] as [EmitAction, any]
        expect(action.iteratorVar).to.eq('f')
      })
    })

    xit('should have the trigger in the instance', () => {
      //
    })
  })

  describe('evalObject', () => {
    xit('should be given the correct args', () => {
      //
    })
  })

  describe('goto', () => {
    xit('should be given the correct args', () => {
      //
    })
  })

  describe('pageJump', () => {
    xit('should be given the correct args', () => {
      //
    })
  })

  describe('popUp', () => {
    xit('should be given the correct args', () => {
      //
    })
  })

  describe('popUpDismiss', () => {
    xit('should be given the correct args', () => {
      //
    })
  })

  describe('refresh', () => {
    xit('should be given the correct args', () => {
      //
    })
  })

  describe('saveObject', () => {
    xit('should be given the correct args', () => {
      //
    })
  })

  describe('updateObject', () => {
    xit('should be given the correct args', () => {
      //
    })
  })
})
