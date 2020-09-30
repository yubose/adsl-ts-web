import { expect } from 'chai'
import yaml, { createNode } from 'yaml'
import { YAMLSeq, YAMLMap, Pair, Scalar } from 'yaml/types'
import signinPageYml from './SignInYml'
import { log, logCyan, logAttention } from '../utils/log'
import identifyPair from '../utils/identifyPair'
import identifySeq from '../utils/identifySeq'
import identifyScalar from '../utils/identifyScalar'

const doc = yaml.parseDocument(signinPageYml)
const components = doc.contents.items[6].value.items as YAMLSeq
const children = components[0].items[2] as Pair

const onClickComponent = children.value.items[6].items[2].value.items[1]
const onClickActionChainPair = onClickComponent.items[2]
const onClickActionChain = onClickActionChainPair.value.items
const actionObjectPair = onClickActionChain[0].items[1] as Pair

// logCyan(JSON.stringify(actionObject, null, 2))

describe('NOODL object identifiers', () => {
  // This "describe" section is testing the different variations of the "same"
  //    noodl object. No matter the instance or data type of a noodl object they
  //    should always return true as long as they represent the same noodl object
  //    when parsed
  describe('composition/composing', () => {
    describe('value strings', () => {
      it('[As raw string] should return true', () => {
        expect(identifyPair.dataKey(new Pair('dataKey', 'formData.vertex'))).to
          .be.true
      })

      it('[As scalar] should return true', () => {
        expect(
          identifyPair.dataKey(
            new Pair(new Scalar('dataKey'), new Scalar('formData.vertex')),
          ),
        ).to.be.true
      })

      it('[Using createNode] should return true', () => {
        expect(
          identifyPair.dataKey(
            new Pair('dataKey', yaml.createNode('formData.vertex', true)),
          ),
        ).to.be.true
      })

      it('[Using createNode] should return true', () => {
        expect(
          identifyPair.dataKey(
            new Pair(
              yaml.createNode('dataKey'),
              yaml.createNode('formData.vertex', true),
            ),
          ),
        ).to.be.true
      })

      it('[Using createNode] should return true', () => {
        expect(
          identifyPair.dataKey(
            new Pair(
              yaml.createNode('dataKey', true),
              yaml.createNode('formData.vertex', true),
            ),
          ),
        ).to.be.true
      })

      it('[Using createNode] should return true', () => {
        expect(
          identifyPair.dataKey(
            new Pair(
              yaml.createNode('dataKey'),
              yaml.createNode('formData.vertex'),
            ),
          ),
        ).to.be.true
      })

      it('[Using createNode] should return true', () => {
        expect(
          identifyPair.dataKey(
            new Pair(yaml.createNode('dataKey'), 'formData.vertex'),
          ),
        ).to.be.true
      })
    })
  })
  describe('Pair', () => {
    describe('action objects', () => {
      it('should be an instance of Pair', () => {
        expect(onClickActionChainPair).to.be.instanceOf(Pair)
      })
      it('should return true', () => {
        expect(identifyPair.actionChain(onClickActionChainPair)).to.be.true
      })

      it('should return false', () => {
        expect(identifyPair.actionChain(new Pair('onHover', []))).to.be.false
      })

      it('should return true', () => {
        expect(
          identifyPair.actionChain(
            new Pair('onHover', [
              { actionType: 'updateObject', object: ['..update'] },
            ]),
          ),
        ).to.be.false
      })
    })

    describe('action chain', () => {
      it('should return false if the value is not an instance of YAMLSeq', () => {
        expect(identifyPair.actionChain(new Pair('onClick', new YAMLMap()))).to
          .be.false

        expect(
          identifyPair.actionChain(
            new Pair(
              'onClick',
              new Pair('actionType', [{ actionType: 'ecosConnection' }]),
            ),
          ),
        ).to.be.false
      })

      it('should return true', () => {
        const seq = new YAMLSeq()
        seq.add(new Pair('.Global.update.abc', '=.builtIn.signIn'))
        expect(identifyPair.actionChain(new Pair('onClick', seq))).to.be.false
      })
    })

    describe('dataKey', () => {
      it('should return true', () => {
        expect(identifyPair.dataKey(new Pair('dataKey', 'formData.vertex'))).to
          .be.true
      })

      it('should return false', () => {
        expect(identifyPair.dataKey(new Pair('path', 'abc.png'))).to.be.false
      })
    })
  })

  describe('Scalar', () => {
    describe('global reference', () => {
      it('should return false', () => {
        expect(identifyScalar.globalReference(new Scalar('..update'))).to.be
          .false
      })

      it('should return false', () => {
        expect(identifyScalar.globalReference(new Scalar('f.update'))).to.be
          .false
      })

      it('should return false', () => {
        expect(identifyScalar.globalReference(new Scalar('...update'))).to.be
          .false
      })

      it('should return false', () => {
        expect(identifyScalar.globalReference(new Scalar('_title'))).to.be.false
      })

      it('should return false', () => {
        expect(identifyScalar.globalReference(new Scalar('.title'))).to.be.false
      })

      it('should return false', () => {
        expect(identifyScalar.globalReference(new Scalar('=.Title'))).to.be
          .false
      })

      it('should return true', () => {
        expect(identifyScalar.globalReference(new Scalar('.Global.vertex'))).to
          .be.true
      })

      it('should return false', () => {
        expect(identifyScalar.globalReference(new Scalar('children'))).to.be
          .false
      })
    })

    describe('local/private reference', () => {
      it('should return true', () => {
        expect(identifyScalar.localReference(new Scalar('..update'))).to.be.true
      })

      it('should return false', () => {
        expect(identifyScalar.localReference(new Scalar('f..update'))).to.be
          .false
      })

      it('should return false', () => {
        expect(identifyScalar.localReference(new Scalar('...update'))).to.be
          .false
      })

      it('should return true', () => {
        expect(identifyScalar.localReference(new Scalar('_title'))).to.be.true
      })

      it('should return false', () => {
        expect(identifyScalar.localReference(new Scalar('.Global.vertex'))).to
          .be.false
      })

      it('should return false', () => {
        expect(identifyScalar.localReference(new Scalar('children'))).to.be
          .false
      })
    })

    describe('path', () => {
      it('should return true', () => {
        expect(identifyScalar.path(new Scalar('path'))).to.be.true
      })

      it('should return false', () => {
        expect(identifyScalar.path(new Scalar('.path'))).to.be.false
      })

      it('should return false', () => {
        expect(identifyScalar.path(new Scalar('resource'))).to.be.false
      })
    })
  })
})

function getMockComponent() {
  return {
    type: 'image',
    path: 'signIn.png',
    onClick: [
      {
        actionType: 'builtIn',
        funcName: 'signIn',
      },
      {
        actionType: 'updateObject',
        object: '..update',
      },
      {
        actionType: 'pageJump',
        destination: 'DashboardPatient',
      },
    ],
    style: {
      backgroundColor: '0x3185c7ff',
      left: '0.267',
      top: '0',
      width: '0.235',
      height: '0.06',
      border: {
        style: '5',
      },
      borderRadius: '15',
    },
  }
}
