import sinon from 'sinon'
import { expect } from 'chai'
import { screen } from '@testing-library/dom'
import { noodl } from './test-utils'
import NOODLUIDOM from './noodl-ui-dom'

let noodluidom: NOODLUIDOM

beforeEach(() => {
  noodluidom = new NOODLUIDOM()
})

describe('noodl-ui-dom', () => {
  it.skip('should wrap nodes with the wrapper if provided', () => {
    //
  })

  it.skip('should call the appropriate event', () => {
    const fn1 = sinon.spy()
    const fn2 = sinon.spy()
    const fn3 = sinon.spy()
    noodluidom.on('create.button', fn1)
    noodluidom.on('create.image', fn2)
    noodluidom.on('create.button', fn3)
    noodluidom.parse({
      id: 'myid123',
      type: 'button',
      noodlType: 'button',
      style: {},
      text: 'hello',
    })
    expect(fn1.called).to.be.true
    expect(fn2.called).to.be.false
    expect(fn3.called).to.be.true
  })

  it.skip('shoulld add the event callback', () => {
    //
  })

  it.skip('should remove the event callback', () => {
    //
  })

  it.skip('should emit events', () => {
    //
  })

  it.skip('should return the registered listeners for the event', () => {
    //
  })

  describe('isValidAttribute', () => {
    xit('', () => {
      //
    })
  })

  describe.skip('onCreateNode', () => {
    //
  })

  describe('parse', () => {
    it('should return the expected node', () => {
      const label = noodl.resolveComponents({
        type: 'label',
        text: 'Title',
        style: {
          color: '0xffffffff',
          width: '0.6',
          height: '0.04',
          fontSize: '18',
          fontStyle: 'bold',
        },
      })[0]
      noodluidom.on('create.label', (node, props) => {
        node.innerHTML = props.children
      })
      const node = noodluidom.parse(label)
      document.body.appendChild(node)
      expect(node).to.be.instanceOf(HTMLLabelElement)
      expect(screen.getByText('Title'))
    })
  })
})
