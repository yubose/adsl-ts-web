import { expect } from 'chai'
import sinon from 'sinon'
import NOODL from '../noodl-ui'
import getElementType from '../resolvers/getElementType'
import getTransformedAliases from '../resolvers/getTransformedAliases'
import getReferences from '../resolvers/getReferences'
import getAlignAttrs from '../resolvers/getAlignAttrs'
import getBorderAttrs from '../resolvers/getBorderAttrs'
import getColors from '../resolvers/getColors'
import getFontAttrs from '../resolvers/getFontAttrs'
import getPosition from '../resolvers/getPosition'
import getSizes from '../resolvers/getSizes'
import getStylesByElementType from '../resolvers/getStylesByElementType'
import getTransformedStyleAliases from '../resolvers/getTransformedStyleAliases'
import getChildren from '../resolvers/getChildren'
import getCustomDataAttrs from '../resolvers/getCustomDataAttrs'
import getEventHandlers from '../resolvers/getEventHandlers'
import Viewport from '../Viewport'
import { NOODLComponent } from '../types'

let noodl: NOODL
let viewport: Viewport
let page: any
let rootNode: HTMLElement
let components = getMockComponents()

beforeEach(() => {
  rootNode = document.createElement('div')
  rootNode.id = 'root'
  noodl = new NOODL()
  viewport = new Viewport()
  page = {
    name: 'InviteSuccess01',
    object: { module: 'patient' },
    components: [{ type: 'button', text: 'hello!' }],
  }
  noodl
    .init({ viewport })
    .setRoot({ InviteSuccess01: { module: 'patient' }, components })
    .setAssetsUrl('https://something.com/assets/')
    .setViewport({ width: 375, height: 667 })
    .setPage(page)
    .setResolvers(
      getElementType,
      getTransformedAliases,
      getReferences,
      getAlignAttrs,
      getBorderAttrs,
      getColors,
      getFontAttrs,
      getPosition,
      getSizes,
      getStylesByElementType,
      getTransformedStyleAliases,
      getChildren as any,
      getCustomDataAttrs,
      getEventHandlers,
    )
})

describe('NOODL', () => {
  describe('hasLifeCycle', () => {
    it('', () => {
      //
    })
  })
  describe('addLifecycleListener', () => {
    it('should add listeners using key and value', () => {
      const spy = sinon.spy()
      expect(noodl.hasLifeCycle('evalObject')).to.be.false
      noodl.addLifecycleListener('evalObject', spy)
      expect(noodl.hasLifeCycle('evalObject')).to.be.true
    })

    it('should add listeners using an object', () => {
      const spy = sinon.spy()
      expect(noodl.hasLifeCycle('evalObject')).to.be.false
      noodl.addLifecycleListener({ evalObject: spy })
      expect(noodl.hasLifeCycle('evalObject')).to.be.true
    })

    it('should add listeners using a function', () => {
      const spy = sinon.spy()
      expect(noodl.hasLifeCycle(spy)).to.be.false
      noodl.addLifecycleListener(spy)
      expect(noodl.hasLifeCycle(spy)).to.be.true
    })
  })

  describe('hasLifecycleListener', () => {
    it('should return true if the key exists in the top level', () => {
      const spy = sinon.spy()
      expect(noodl.hasLifeCycle(spy)).to.be.false
      noodl.addLifecycleListener(spy)
      expect(noodl.hasLifeCycle(spy)).to.be.true
    })

    it('should return true if the key exists in the second level for nested objects', () => {
      const spy = sinon.spy()
      expect(noodl.hasLifeCycle('evalObject')).to.be.false
      noodl.addLifecycleListener({
        action: {
          evalObject: spy,
        },
      })
      expect(noodl.hasLifeCycle('evalObject')).to.be.true
    })
  })

  it('should update the "nodes" property that keeps a cache of proxied nodes of the current page\'s resolved components after resolveComponents is called', () => {
    expect(noodl.nodes).to.be.undefined
    noodl.resolveComponents()
    expect(noodl.nodes).to.be.an('object')
  })
})

// noodl.addLifecycleListener({
//   action: {
//     evalObject: action.onEvalObject,
//     goto: action.onGoto,
//     pageJump: action.onPageJump,
//     popUp: action.onPopUp,
//     popUpDismiss: action.onPopUpDismiss,
//     refresh: action.onRefresh,
//     saveObject: action.onSaveObject,
//     updateObject: action.onUpdateObject,
//   },
// builtIn: {
//   checkUsernamePassword: builtIn.checkUsernamePassword,
//   enterVerificationCode: builtIn.checkVerificationCode,
//   goBack: builtIn.goBack,
//   lockApplication: builtIn.lockApplication,
//   logOutOfApplication: builtIn.logOutOfApplication,
//   logout: builtIn.logout,
//   signIn: builtIn.signIn,
//   signUp: builtIn.signUp,
//   signout: builtIn.signout,
//   toggleCameraOnOff: builtIn.toggleCameraOnOff,
//   toggleMicrophoneOnOff: builtIn.toggleMicrophoneOnOff,
// },
// onChainStart: lifeCycle.onChainStart,
// onChainEnd: lifeCycle.onChainEnd,
// onChainError: lifeCycle.onChainError,
// onChainAborted: lifeCycle.onChainAborted,
// onAfterResolve: lifeCycle.onAfterResolve,
// } as any)

function getMockComponents(): NOODLComponent[] {
  return [
    {
      type: 'view',
      style: {
        left: '0',
        top: '0',
        width: '1',
        height: '1',
      },
      children: [
        {
          type: 'view',
          style: {
            left: '0',
            top: '0',
            width: '1',
            height: '0.15',
            backgroundColor: '0x388eccff',
          },
          children: [
            {
              type: 'label',
              text: 'Invite',
              style: {
                color: '0xffffffff',
                left: '0',
                top: '0.06',
                width: '1',
                height: '0.04',
                fontSize: '18',
                display: 'inline',
                textAlign: {
                  x: 'center',
                  y: 'center',
                },
              },
            },
          ],
        },
        {
          type: 'view',
          style: {
            left: '0',
            top: '0.15',
            width: '1',
            height: '0.85',
          },
          children: [
            {
              type: 'image',
              path: 'successMark.png',
              style: {
                left: '0.3',
                top: '0.1',
                width: '0.4',
                height: '0.2',
              },
            },
            {
              type: 'label',
              text: 'Success!',
              style: {
                left: '0.1',
                top: '0.35',
                width: '0.8',
                height: '0.03',
                fontSize: '20',
                fontStyle: 'bold',
                color: '0x000000bb',
                display: 'inline',
                textAlign: {
                  x: 'center',
                  y: 'center',
                },
              },
            },
            {
              type: 'button',
              onClick: [
                {
                  actionType: 'pageJump',
                  destination: 'MeetingLobbyStart',
                },
              ],
              text: 'Okay',
              style: {
                left: '0.1',
                top: '0.65',
                width: '0.8',
                height: '0.06',
                fontSize: '18',
                color: '0xffffffff',
                backgroundColor: '0x388eccff',
                textAlign: {
                  x: 'center',
                },
                border: {
                  style: '1',
                },
              },
            },
          ],
        },
      ],
    },
  ]
}
