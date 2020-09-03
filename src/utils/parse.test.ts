import _ from 'lodash'
import { expect } from 'chai'
import {
  eventTypes,
  NOODLComponent,
  NOODLComponentProps,
  SelectOption,
} from 'noodl-ui'
import { forEachEntries } from './common'
import createElement from './createElement'
import composeParsers from './composeParsers'
import parse from './parse'

describe('composeParsers', () => {
  let noodlComponent: NOODLComponent

  beforeEach(() => {
    noodlComponent = {
      type: 'image',
      viewTag: 'microphone',
      onClick: [
        {
          actionType: 'builtIn',
          funcName: 'toggleMicrophoneOnOff',
        },
      ],
      path: 'disableMicrophone.png',
      pathSelected: 'aitmedLogo_selected.png',
      style: {
        left: '0.22',
        top: '0.0185',
        width: '0.12',
        height: '0.07',
      },
    }
  })

  describe('parseChildren', () => {
    it('should append to innerHTML if children is a string', () => {
      _.assign(noodlComponent, {
        type: 'button',
        text: 'hello',
      })
      const node = document.createElement('div')
      // const node = parse(noodlComponent)
      console.info(node?.innerHTML)
      console.info(node?.innerHTML)
      console.info(node?.innerHTML)
      console.info(node?.innerHTML)
      console.info(node?.innerHTML)
      expect(node?.innerHTML)
    })
  })
})
