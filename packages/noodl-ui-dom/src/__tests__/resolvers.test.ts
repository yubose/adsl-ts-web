import chalk from 'chalk'
import { prettyDOM } from '@testing-library/dom'
import { expect } from 'chai'
import { applyMockDOMResolver, noodlui, toDOM } from '../test-utils'
import * as resolvers from '../resolvers'
import { List, ListItem } from 'noodl-ui'

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
      const result = applyMockDOMResolver({
        component: {
          type: 'list',
          iteratorVar: 'hello',
          listObject: [],
          children: [
            { type: 'listItem', children: [{ type: 'label', text: 'f' }] },
          ],
        },
        resolver: resolvers.image,
      })
      const component = result.component as List
      const componentCache = result.componentCache
      component.removeChild()
      expect(componentCache).to.have.lengthOf(0)
      const dataObject = { fruit: 'apple' }
      component.addDataObject(dataObject)
      // component.createChild(listItem)
      const listItem = component.child() as ListItem
      component.emit(
        'create.list.item',
        { dataObject, listItem, index: 0 } as any,
        {} as any,
      )
      expect(componentCache).to.have.lengthOf(1)

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
  it('should have object-fit set to "contain"', () => {
    expect(
      applyMockDOMResolver({
        component: { type: 'video', videoFormat: 'mp4' },
        resolver: resolvers.video,
      }).node.style.objectFit,
    ).to.equal('contain')
  })

  it('should create the source element as a child if the src is present', () => {
    const { node } = applyMockDOMResolver({
      component: { type: 'video', path: 'asdloldlas.mp4', videoFormat: 'mp4' },
      resolver: resolvers.video,
    })
    const sourceEl = node?.querySelector('source')
    expect(sourceEl).to.exist
  })

  it('should have src set on the child source element instead of the video element itself', () => {
    const path = 'asdloldlas.mp4'
    const { node } = applyMockDOMResolver({
      component: { type: 'video', path: 'asdloldlas.mp4', videoFormat: 'mp4' },
      resolver: resolvers.video,
    })
    const sourceEl = node?.querySelector('source')
    expect(node?.getAttribute('src')).not.to.equal(noodlui.assetsUrl + path)
    expect(sourceEl?.getAttribute('src')).to.equal(noodlui.assetsUrl + path)
  })

  it('should have the video type on the child source element instead of the video element itself', () => {
    const { node } = applyMockDOMResolver({
      component: { type: 'video', path: 'abc123.mp4', videoFormat: 'mp4' },
      resolver: resolvers.video,
    })
    const sourceEl = node?.querySelector('source')
    expect(node?.getAttribute('type')).not.to.equal('mp4')
    expect(sourceEl?.getAttribute('type')).to.equal(`video/mp4`)
  })

  it('should include the "browser not supported" message', () => {
    const { node } = applyMockDOMResolver({
      component: { type: 'video', path: 'abc.jpeg', videoFormat: 'mp4' },
      resolver: resolvers.video,
    })
    const p = node.querySelector('p')
    expect(/sorry/i.test(p?.textContent as string)).to.be.true
  })

  it('should create a "source" element and attach the src attribute for video components', () => {
    const path = 'pathology.mp4'
    const { assetsUrl } = applyMockDOMResolver({
      component: { type: 'video', path, videoFormat: 'mp4', id: 'id123' },
      resolver: resolvers.video,
    })
    const sourceElem = document.body?.querySelector('source')
    expect(sourceElem?.getAttribute('src')).to.equal(assetsUrl + path)
  })
})
