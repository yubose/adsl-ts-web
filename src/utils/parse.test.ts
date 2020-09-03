import _ from 'lodash'
import { expect } from 'chai'
import { eventTypes, NOODLComponentProps, SelectOption } from 'noodl-ui'
import { forEachEntries } from './common'
import createElement from './createElement'
import composeParsers from './composeParsers'
import parse from './parse'

describe('composeParsers', () => {
  const noodlComponent = {
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

  it.skip('should compose parsers and run them on the dom node', () => {})
})
