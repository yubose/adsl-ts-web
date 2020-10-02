import _ from 'lodash'
import sinon from 'sinon'
import { expect } from 'chai'
import { getByText } from '@testing-library/dom'
import { NOODLComponent, NOODLComponentProps } from 'noodl-ui'
import NOODLUIDOM, { DataValueElement } from 'noodl-ui-dom'
import { noodl, noodluidom } from '../utils/test-utils'

let container: HTMLDivElement
let parser: NOODLUIDOM

beforeEach(() => {
  container = document.createElement('div')
  parser = new NOODLUIDOM()
})

afterEach(() => {
  // console.info(prettyDOM(container))
})

describe('parse', () => {
  let component: NOODLComponentProps

  xit('should attach the id', () => {
    //
  })

  xit('should attach the src attr', () => {
    //
  })

  xit('should attach the "poster" attr on videos', () => {
    //
  })

  xit('should attach the "type" attr if theres a "props.videoFormat"', () => {
    //
  })

  xit('should attach placeholders', () => {
    //
  })

  xit('should attach data-listid', () => {
    //
  })

  xit('should attach data-name', () => {
    //
  })

  xit('should attach data-key', () => {
    //
  })

  xit('should attach data-ux', () => {
    //
  })

  xit('should attach data-value', () => {
    //
  })

  describe('input/select/textarea (data value elements)', () => {
    xit('should show placeholder if there is no data-value available', () => {
      // TODO - props.placeholder
    })

    describe('select elements', () => {
      xit('should show the data-value if it was received with one', () => {
        //
      })

      xit('should show the first item in the options list by default if a data-value isnt available', () => {
        //
      })
    })
  })

  describe('view elements (opposite of input/select/textarea elements, like div or span', () => {
    xit('should show text/placeholder if there is no data-value available', () => {
      //  TODO - props.text || props.placeholder
    })
  })

  describe.skip('parseEventHandlers', () => {
    beforeEach(() => {
      // parser.add(parseEventHandlers)
    })

    // _.forEach(
    //   ['onClick', 'onMouseEnter', 'onMouseLeave'] as const,
    //   (eventType) => {
    //     it(`should attach the "${eventType}" event handler`, () => {
    //       const handler = sinon.spy()
    //       component[eventType] = handler as any
    //       const node = parser.parse(component)
    //       node && container.appendChild(node)
    //       node && mapUserEvent(eventType)?.(node)
    //       expect(handler.called).to.be.true
    //     })
    //   },
    // )

    it.skip('should increment the listener count if a listener is added via addEventListener', () => {
      //
    })
  })

  describe.skip('parseStyles', () => {
    beforeEach(() => {
      // parser.add(parseStyles)
    })

    it('should attach style attributes', () => {
      const node = parser.parse(component)
      node && container.appendChild(node)
      expect(node?.style.borderRadius).to.eq('0px')
      expect(node?.style.borderStyle).to.eq('none')
      expect(node?.style.borderBottomStyle).to.eq('solid')
    })
  })

  describe.skip('parseDataValues', () => {
    beforeEach(() => {})

    _.forEach(['input', 'select', 'textarea'] as const, (tag) => {
      it(`should attach the value of data-value as the value for ${tag} elements`, () => {
        let node: DataValueElement | undefined
        const dataValue = 'fruits'
        component['data-value'] = dataValue
        component['type'] = tag
        if (tag === 'select') {
          component['data-value'] = 'banana'
          component['options'] = [
            { value: 'apple', key: 'apple', label: 'Apple' },
            { value: 'banana', key: 'banana', label: 'Banana' },
          ]
          node = parser.parse(component) as DataValueElement
          expect(node?.value).to.eq('apple')
        } else {
          node = parser.parse(component) as DataValueElement
          expect(node?.value).to.eq(dataValue)
        }
      })
    })
  })
})
