import { expect } from 'chai'
import { YAMLSeq } from 'yaml/types'
import _ from 'lodash'
import identifyPair from '../utils/identifyPair'
import EvaluatorsList from '../evaluators/EvaluatorsList'
import makeEvaluator from '../evaluators/makeEvaluator'

let evaluators: EvaluatorsList

beforeEach(() => {
  evaluators = new EvaluatorsList()
})

describe('EvaluatorsList', () => {
  it('should add the evaluator', () => {
    const evaluator = makeEvaluator((value) => null)
    evaluators.addEvaluator(evaluator)
    expect(evaluators.has(evaluator)).to.be.true
  })

  it('should add the roots with the given object', () => {
    evaluators.addRoot({
      fruits: ['apples'],
      myName: 'fbi',
    })
    expect(evaluators.getRoot()).to.deep.equal({
      fruits: ['apples'],
      myName: 'fbi',
    })
  })

  it('should add the roots with the given key/value', () => {
    evaluators.addRoot('myName', 'apple')
    expect(evaluators.getRoot()).to.deep.equal({
      myName: 'apple',
    })
  })
})

describe('Evaluating', () => {
  describe('YAML Pairs', () => {
    describe('Action chains', () => {
      it('should correctly apply the action chain invalidators', () => {
        const actionChain = [
          { actionTypes: 'pageJump', destination: 'SignIn' },
          { abc: 'updateObject', object: { hello: 'hi' } },
        ]

        const actionChainEvaluator = makeEvaluator((value, { push }) => {
          if (Array.isArray(value)) {
            for (let index = 0; index < value.length; index++) {
              const action = value[index]
              if (action && 'actionType' in action) {
                return
              }
            }
            push(
              'Action chains must have action objects with property "actionType"',
            )
          } else if (value instanceof YAMLSeq) {
            // @ts-expect-error
            if (!identifyPair.actionChain(value)) {
              push('Missing action objects with property "actionType"')
            }
          }
        })

        actionChainEvaluator.addContext('hello', 'hi')

        evaluators.addEvaluator(actionChainEvaluator)
        evaluators.run(actionChain, { name: 'MyPageName' })

        expect(evaluators.getResults()).to.deep.equal([
          {
            context: {
              name: 'MyPageName',
              hello: 'hi',
            },
            results: [
              {
                reason:
                  'Action chains must have action objects with property "actionType"',
                value: actionChain,
              },
            ],
          },
        ])
      })
    })

    describe('Page roots', () => {
      const pageRootEvaluator = makeEvaluator((value, { push }) => {
        //
      })

      it('should ', () => {
        //
      })
    })
  })
})
