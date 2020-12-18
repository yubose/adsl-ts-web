import chalk from 'chalk'
import { expect } from 'chai'
import { prettyDOM, screen } from '@testing-library/dom'
import { noodlui, toDOM } from '../test-utils'
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

  describe('dataset', () => {
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
  let node: any

  beforeEach(() => {
    node = toDOM({
      type: 'view',
      dataKey: 'formData.password',
      viewTag: 'myviewtag',
      listId: 'onetwo',
      onHover: [],
      onClick: [],
    })[0]
    node.attachStatus = 'pending'
    // prettier-ignore
    node.addEventListener('click', () => (node.attachStatus = 'attached[onclick]'))
    // prettier-ignore
    node.addEventListener('change', () => (node.attachStatus = 'attached[onchange]'))
  })

  after(() => {
    node = null
  })

  // TODO - onEnter and others
  const eventNames = ['onClick', 'onChange']
  eventNames.forEach((eventName) => {
    it(`should attach the ${chalk.yellow(eventName)} handler`, () => {
      if (eventName === 'onClick') {
        node.click()
        expect(node).to.have.property('attachStatus').eq('attached[onclick]')
      }
      if (eventName === 'onChange') {
        node.dispatchEvent(new Event('change'))
        expect(node).to.have.property('attachStatus').eq('attached[onchange]')
      }
    })
  })
})

describe('image', () => {
  it('should attach the pointer cursor if it has onClick', () => {
    const [node, component] = toDOM({ type: 'image', onClick: [] })
    resolvers.image.resolve(node, component)
    expect(node.style).to.have.property('cursor').eq('pointer')
  })

  it('should set width and height to 100% if it has children (deprecate soon)', () => {
    const [node, component] = toDOM({ type: 'image', children: [] })
    resolvers.image.resolve(node, component)
    expect(node.style).to.have.property('width').eq('100%')
    expect(node.style).to.have.property('height').eq('100%')
  })
})

describe('label', () => {
  it('should attach the pointer cursor if it has onClick', () => {
    const [node, component] = toDOM({ type: 'label', onClick: [] })
    resolvers.label.resolve(node, component)
    expect(node.style).to.have.property('cursor').eq('pointer')
  })
})

describe('list', () => {
  xit(
    `should attach to noodlui cache when receiving the ` +
      `${chalk.yellow('create.list.item')} event`,
    () => {
      //
    },
  )

  xit(
    `should remove from noodlui cache when receiving the ` +
      `${chalk.yellow('remove.list.item')} event`,
    () => {
      //
    },
  )

  xit(
    `should remove from the DOM receiving the ` +
      `${chalk.yellow('remove.list.item')} event`,
    () => {
      //
    },
  )

  // TODO - update.list.item handling?
})

describe('video', () => {
  xit('should attach the controls if it has them', () => {
    //
  })

  xit('should attach the poster if it has it', () => {
    //
  })

  xit('should attach the src on the source node instead of the video node', () => {
    //
  })

  xit(`should attach the "type" attribute if it received a ${chalk.yellow(
    'videoFormat',
  )}`, () => {
    //
  })
})
