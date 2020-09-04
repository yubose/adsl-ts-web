import _ from 'lodash'
import { expect } from 'chai'
import {
  eventTypes,
  NOODLComponent,
  NOODLComponentProps,
  SelectOption,
} from 'noodl-ui'
import { noodl } from 'app/client'
import { forEachEntries } from './common'
import createElement from './createElement'
import composeParsers from './composeParsers'
import parse, { parseChildren } from './parse'

describe.skip('composeParsers', () => {
  let components: NOODLComponentProps[]
  let component: NOODLComponentProps

  beforeEach(() => {
    components = noodl.resolveComponents({
      module: 'patient',
      components: [
        {
          type: 'button',
          text: 'hello',
          onClick: [
            {
              actionType: 'builtIn',
              funcName: 'toggleMicrophoneOnOff',
            },
          ],
          style: {
            left: '0.22',
            top: '0.0185',
            width: '0.12',
            height: '0.07',
          },
        } as NOODLComponent,
      ],
    })
    console.info(components)
    component = components[0]
  })

  describe('parseChildren', () => {
    it('should append to innerHTML if children is a string', () => {
      // const _parse = composeParsers(parseChildren)
      // const node = _parse(component)
      // expect(node?.innerHTML).to.eq('hello')
    })
  })
})
