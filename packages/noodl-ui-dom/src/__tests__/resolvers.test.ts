import chalk from 'chalk'
import { expect } from 'chai'
import { prettyDOM, screen } from '@testing-library/dom'
import {
  applyMockDOMResolver,
  getDOMResolver,
  noodlui,
  noodluidom,
  toDOM,
} from '../test-utils'
import * as resolvers from '../resolvers'

describe('default resolvers', () => {
  describe('common', () => {
    it('should display data value if it is displayable', () => {
      const { node } = applyMockDOMResolver({
        resolver: resolvers.common,
        pageName: 'F',
        pageObject: { formData: { password: 'asfafsbc' } },
        component: {
          type: 'label',
          dataKey: 'F.formData.password',
          text: 'fdsfdsf',
        },
      })
      expect(node.textContent).to.eq('asfafsbc')
    })
  })

  describe('button', () => {
    it('should have a pointer cursor if it has an onClick', () => {
      const { node } = applyMockDOMResolver({
        resolver: resolvers.common,
        pageName: 'F',
        pageObject: { formData: { password: 'asfafsbc' } },
        component: {
          type: 'button',
          text: 'hello',
          style: { fontSize: '14' },
          onClick: [],
        },
      })
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
    expect(
      applyMockDOMResolver({
        component: { type: 'image', onClick: [] },
        resolver: resolvers.image,
      }).node.style,
    )
      .to.have.property('cursor')
      .eq('pointer')
  })

  it('should set width and height to 100% if it has children (deprecate soon)', () => {
    const {
      node: { style },
    } = applyMockDOMResolver({
      component: { type: 'image', children: [] },
      resolver: resolvers.image,
    })
    expect(style).to.have.property('width').eq('100%')
    expect(style).to.have.property('height').eq('100%')
  })
})

describe('label', () => {
  it('should attach the pointer cursor if it has onClick', () => {
    expect(
      applyMockDOMResolver({
        component: { type: 'label', onClick: [] },
        resolver: resolvers.label,
      }).node.style,
    )
      .to.have.property('cursor')
      .eq('pointer')
  })
})

describe('list', () => {
  xit(
    `should attach to noodlui cache when receiving the ` +
      `${chalk.yellow('create.list.item')} event`,
    () => {
      const { component, componentCache } = applyMockDOMResolver({
        component: {
          type: 'list',
          iteratorVar: 'hello',
          listObject: [{ hello: 'greeting' }],
          children: [{ type: 'listItem' }],
        },
        resolver: resolvers.image,
      })

      // for (let child of component.children()) {
      //   expect(componentCache().state()).to.have.property(child.id)
      // }
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
