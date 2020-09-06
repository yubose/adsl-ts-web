import _ from 'lodash'
import sinon from 'sinon'
import userEvent from '@testing-library/user-event'
import { expect } from 'chai'
import { prettyDOM } from '@testing-library/dom'
import { NOODLComponent, NOODLComponentProps, SelectOption } from 'noodl-ui'
import { noodl } from 'setupTests'
import { mapUserEvent } from 'utils/test-utils'
import { forEachEntries } from './common'
import createElement from './createElement'
import composeParsers from './composeParsers'
import parse, {
  parseChildren,
  parseDataValues,
  parseEventHandlers,
  parseStyles,
} from './parse'
import { DataValueElement } from 'app/types'

let container: HTMLDivElement

beforeEach(() => {
  container = document.createElement('div')
})

afterEach(() => {
  // console.info(prettyDOM(container))
})

describe('parse', () => {
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
            border: {
              style: '2',
            },
          },
        } as NOODLComponent,
      ],
    })
    // console.info(components)
    component = components[0]
  })

  describe('record keeper (wrapper)', () => {
    describe('hasAttribute', () => {
      it('should return false', () => {
        const div = document.createElement('div')
        const parse = 
      })
    })
  })

  describe('parseChildren', () => {
    it('should append to innerHTML if children is a string', () => {
      const _parse = composeParsers(parseChildren)
      const node = _parse(component)
      node && container.appendChild(node)
      expect(node?.innerHTML).to.eq('hello')
    })
  })

  describe('parseEventHandlers', () => {
    _.forEach(
      ['onClick', 'onMouseEnter', 'onMouseLeave'] as const,
      (eventType) => {
        it(`should attach the "${eventType}" event handler`, () => {
          const handler = sinon.spy()
          component[eventType] = handler as any
          const _parse = composeParsers(parseEventHandlers)
          const node = _parse(component)
          node && container.appendChild(node)
          node && mapUserEvent(eventType)?.(node)
          expect(handler.called).to.be.true
        })
      },
    )

    it.skip('should increment the listener count if a listener is added via addEventListener', () => {
      //
    })
  })

  describe('parseStyles', () => {
    it('should attach style attributes', () => {
      const node = composeParsers(parseStyles)(component)
      node && container.appendChild(node)
      expect(node?.style.borderRadius).to.eq('0px')
      expect(node?.style.borderStyle).to.eq('none')
      expect(node?.style.borderBottomStyle).to.eq('solid')
    })
  })

  describe('parseDataValues', () => {
    _.forEach(['input', 'select', 'textarea'] as const, (tag) => {
      it(`should attach the value of data-value as the value for ${tag} elements`, () => {
        const dataValue = 'fruits'
        component['data-value'] = dataValue
        component['type'] = tag
        let node: DataValueElement | undefined
        if (tag === 'select') {
          component['data-value'] = 'banana'
          component['options'] = [
            { value: 'apple', key: 'apple', label: 'Apple' },
            { value: 'banana', key: 'banana', label: 'Banana' },
          ]
          node = composeParsers(
            parseChildren,
            parseDataValues,
          )(component) as DataValueElement
          expect(node?.value).to.eq('banana')
        } else {
          node = composeParsers(parseDataValues)(component) as DataValueElement
          expect(node?.value).to.eq(dataValue)
        }
        console.info(prettyDOM(node))
      })
    })
  })
})
