import sinon from 'sinon'
import { prettyDOM, screen } from '@testing-library/dom'
import { expect } from 'chai'
import { NOODLComponent, NOODLComponentProps } from 'noodl-ui'
import { noodl } from './test-utils'
import NOODLUIDOM from './noodl-ui-dom'

let noodluidom: NOODLUIDOM

beforeEach(() => {
  noodluidom = new NOODLUIDOM()
})

describe('noodl-ui-dom', () => {
  it('should add the func to the callbacks list', () => {
    const spy = sinon.spy()
    noodluidom.on('create.button', spy)
    const callbacksList = noodluidom.getCallbacks('create.button')
    expect(callbacksList).to.be.an('array')
    expect(callbacksList).to.have.members([spy])
  })

  it('should remove the func from the callbacks list', () => {
    const spy = sinon.spy()
    noodluidom.on('create.button', spy)
    let callbacksList = noodluidom.getCallbacks('create.button')
    expect(callbacksList).to.have.members([spy])
    noodluidom.off('create.button', spy)
    callbacksList = noodluidom.getCallbacks('create.button')
    expect(callbacksList).to.be.an('array')
    expect(callbacksList).not.to.include.members([spy])
  })

  it('should emit events', () => {
    const spy = sinon.spy()
    noodluidom.on('create.label', spy)
    expect(spy.called).to.be.false
    // @ts-expect-error
    noodluidom.emit('create.label')
    expect(spy.called).to.be.true
  })

  describe('calling the appropriate event', () => {
    let fn1: sinon.SinonSpy
    let fn2: sinon.SinonSpy
    let fn3: sinon.SinonSpy

    beforeEach(() => {
      fn1 = sinon.spy()
      fn2 = sinon.spy()
      fn3 = sinon.spy()
      noodluidom.on('create.button', fn1)
      noodluidom.on('create.image', fn2)
      noodluidom.on('create.button', fn3)
    })

    xit('should call callbacks that were subscribed', () => {
      noodluidom.parse(
        noodl.resolveComponents({
          id: 'myid123',
          type: 'button',
          noodlType: 'button',
          text: 'hello',
        } as NOODLComponent),
      )
      expect(fn1.called).to.be.true
      expect(fn3.called).to.be.true
    })

    it('should not call callbacks that were not subscribed', () => {
      noodluidom.parse(
        noodl.resolveComponents({
          id: 'myid123',
          type: 'label',
          noodlType: 'label',
          text: 'hello',
        } as NOODLComponent),
      )
      expect(fn1.called).to.be.false
      expect(fn2.called).to.be.false
      expect(fn3.called).to.be.false
    })
  })

  describe('isValidAttribute', () => {
    it('should return true for possible assigned attributes on the dom node', () => {
      expect(noodluidom.isValidAttr('div', 'style')).to.be.true
      expect(noodluidom.isValidAttr('div', 'setAttribute')).to.be.true
      expect(noodluidom.isValidAttr('div', 'id')).to.be.true
      expect(noodluidom.isValidAttr('div', 'dataset')).to.be.true
    })

    it('should return false for all of these', () => {
      expect(noodluidom.isValidAttr('div', 'abc')).to.be.false
      expect(noodluidom.isValidAttr('div', 'value')).to.be.false
      expect(noodluidom.isValidAttr('div', 'options')).to.be.false
    })

    it('should return true for all of these', () => {
      expect(noodluidom.isValidAttr('textarea', 'value')).to.be.true
      expect(noodluidom.isValidAttr('input', 'value')).to.be.true
      expect(noodluidom.isValidAttr('select', 'value')).to.be.true
      expect(noodluidom.isValidAttr('input', 'placeholder')).to.be.true
      expect(noodluidom.isValidAttr('input', 'required')).to.be.true
    })

    it('should return false for all of these', () => {
      expect(noodluidom.isValidAttr('select', 'abc')).to.be.false
      expect(noodluidom.isValidAttr('select', 'rows')).to.be.false
      expect(noodluidom.isValidAttr('input', 'rows')).to.be.false
      expect(noodluidom.isValidAttr('textarea', 'options')).to.be.false
    })
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
      })
      noodluidom.on('create.label', (node, props) => {
        if (node) node.innerHTML = `${props.children}`
      })
      const node = noodluidom.parse(label)
      if (node) document.body.appendChild(node)
      expect(node).to.be.instanceOf(HTMLLabelElement)
      expect(screen.getByText('Title'))
    })

    describe('recursing children', () => {
      const labelText = 'the #1 label'
      let component: NOODLComponentProps

      beforeEach(() => {
        component = {
          type: 'div',
          noodlType: 'view',
          id: 'abc',
          style: {
            left: '0',
          },
          children: [
            {
              type: 'div',
              noodlType: 'view',
              text: 'Back',
              style: {},
              id: 'label123',
              children: [
                {
                  type: 'ul',
                  noodlType: 'list',
                  id: 'list123',
                  contentType: 'listObject',
                  listObject: [],
                  iteratorVar: 'itemObject',
                  style: {},
                  children: [
                    {
                      type: 'label',
                      noodlType: 'label',
                      style: {},
                      id: 'label1223',
                      children: labelText,
                      text: labelText,
                    },
                  ],
                },
              ],
            },
          ],
        } as NOODLComponentProps
      })

      it('should append nested children as far down as possible', () => {
        noodluidom.on('create.label', (node, inst) => {
          if (node) node.innerHTML = inst.get('text')
        })
        noodluidom.parse(noodl.resolveComponents(component))
        console.info(prettyDOM())
        expect(screen.getByText(labelText))
      })
    })
  })

  describe('noodlType: plugin', () => {
    it('should receive null as the "DOM node" in the callback', () => {
      const spy = sinon.spy()
      const component = {
        id: '123',
        type: 'plugin',
        noodlType: 'plugin',
        path: 'https://what.com/what.jpg',
      } as NOODLComponent
      noodluidom.on('create.plugin', spy)
      noodluidom.parse(noodl.resolveComponents(component), document.body)
      expect(spy.firstCall.args[0]).to.be.null
    })
  })
})
