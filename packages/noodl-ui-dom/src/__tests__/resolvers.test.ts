import chalk from 'chalk'
import sinon from 'sinon'
import { expect } from 'chai'
import { prettyDOM, screen } from '@testing-library/dom'
import { noodlui, noodluidom, toDOM } from '../test-utils'
import { getDataAttribKeys } from '../utils'
import * as resolvers from '../resolvers'

describe('default resolvers', () => {
  describe('common', () => {
    it('should display data value if it is displayable', () => {
      noodlui
        .setPage('F')
        .use({ getRoot: () => ({ F: { formData: { password: 'abc' } } }) })
      toDOM({ type: 'label', dataKey: 'formData.password' })
      expect(screen.findByText('abc')).to.exist
    })
  })

  describe('button', () => {
    it('should have a pointer cursor if it has an onClick', () => {
      const [node, component] = toDOM({
        type: 'button',
        text: 'hello',
        style: { fontSize: '14' },
        onClick: [],
      })
      resolvers.button.resolve(node, component)
      expect(node.style).to.have.property('cursor').eq('pointer')
    })
  })

  xdescribe('dataset', () => {
    let node: any

    beforeEach(() => {
      noodlui
        .setPage('F')
        .use({ getRoot: () => ({ F: { formData: { password: 'abc' } } }) })
      node = toDOM({
        type: 'view',
        dataKey: 'formData.password',
        viewTag: 'myviewtag',
        listId: 'onetwo',
      })[0]
    })
    ;['key', 'name', 'value', 'ux', 'viewtag'].forEach((key) => {
      it(`should attach the ${chalk.yellow('data-' + key)} key`, () => {
        expect(node.dataset).to.have.property(key)
      })
    })
  })
})

describe('events', () => {
  let node: HTMLElement

  beforeEach(() => {
    node = toDOM({
      type: 'view',
      dataKey: 'formData.password',
      viewTag: 'myviewtag',
      listId: 'onetwo',
      onHover: [],
      onClick: [],
    })[0]
    // @ts-expect-error
    node.addEventListener('click', function () {
      this.attachStatus = 'attached'
    })
    // @ts-expect-error
    node.addEventListener('change', function () {
      this.attachStatus = 'attached'
    })
  })

  // TODO - onEnter and others
  const eventNames = ['onClick', 'onChange']
  eventNames.forEach((eventName) => {
    it(`should attach the ${chalk.yellow(eventName)} handler`, () => {
      node = toDOM({
        type: eventName === 'onChange' ? 'textField' : 'label',
        dataKey: 'formData.password',
        [eventName]: [],
      })[0]
      if (eventName === 'onClick') node.attachStatus = 'pending'
      if (eventName === 'onChange') node.attachStatus = 'pending'
      expect(node[`${eventName.toLowerCase()}`]).to.be.a('function')
    })
  })
})
