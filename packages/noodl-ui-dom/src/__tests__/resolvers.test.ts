import chalk from 'chalk'
import sinon from 'sinon'
import {
  ComponentInstance,
  createComponent,
  List,
  ListItem,
  NOODLComponent,
} from 'noodl-ui'
import { waitFor } from '@testing-library/dom'
import { expect } from 'chai'
import { applyMockDOMResolver, noodlui, noodluidom, toDOM } from '../test-utils'
import NOODLUIDOM from '../noodl-ui-dom'
import * as resolvers from '../resolvers'

const getNoodlList = () =>
  ({
    type: 'list',
    iteratorVar: 'itemObject',
    listObject: [
      { key: 'gender', value: 'Male' },
      { key: 'gender', value: 'Female' },
      { key: 'gender', value: 'Other' },
    ],
    children: [
      {
        type: 'listItem',
        children: [
          { type: 'label', dataKey: 'itemObject.value' },
          { type: 'image', path: 'abc.png' },
        ],
      },
    ],
  } as NOODLComponent)

describe(chalk.keyword('orange')('resolvers'), () => {
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

  describe('button', () => {
    it('should have a pointer cursor if it has an onClick', () => {
      expect(
        applyMockDOMResolver({
          resolver: resolvers.button,
          pageName: 'F',
          pageObject: { formData: { password: 'asfafsbc' } },
          component: {
            type: 'button',
            text: 'hello',
            style: { fontSize: '14' },
            onClick: [{ emit: { dataKey: { var1: 'g' }, actions: [] } }],
          },
        }).node.style,
      )
        .to.have.property('cursor')
        .eq('pointer')
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
  const eventNames = ['onBlur', 'onClick', 'onChange']
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
  it(`should add created list items to the component cache`, () => {
    const result = applyMockDOMResolver({
      component: getNoodlList(),
      resolver: resolvers.image,
    })
    const component = result.component as List
    const componentCache = result.componentCache
    component.children().forEach((child: any) => {
      expect(componentCache().has(child)).to.be.true
    })
    expect(componentCache().length).to.eq(4)
    component.addDataObject({})
    expect(componentCache().length).to.eq(5)
  })

  it(`should remove removed list items from the component cache`, () => {
    const result = applyMockDOMResolver({
      component: getNoodlList(),
      resolver: resolvers.image,
    })
    const component = result.component as List
    const componentCache = result.componentCache
    expect(componentCache().length).to.eq(4)
    const child2 = component.child(1) as ListItem
    expect(componentCache().has(child2)).to.be.true
    component.removeDataObject(child2.getDataObject())
    expect(componentCache().has(child2)).to.be.false
  })

  it(`should remove the corresponding list item's DOM node from the DOM`, () => {
    const result = applyMockDOMResolver({
      component: getNoodlList(),
      resolver: resolvers.image,
    })
    const component = result.component as List
    const child2 = component.child(1)
    const child2Node = document.getElementById(child2?.id || '')
    expect(document.body.contains(child2Node)).to.be.true
    component.removeDataObject(child2?.getDataObject())
    expect(document.body.contains(child2Node)).to.be.false
  })

  // TODO - update.list.item handling?
})

describe('page', () => {
  let result: ReturnType<typeof applyMockDOMResolver>
  let node: HTMLIFrameElement
  let component: ComponentInstance

  beforeEach(() => {
    result = applyMockDOMResolver({
      component: { type: 'page', path: 'LeftPage' },
      pageName: 'Hello',
      pageObject: {},
      root: {
        LeftPage: {
          components: [
            { type: 'image', path: 'abc.png' },
            {
              type: 'button',
              text: 'what',
              onClick: [{ goto: 'Somewhere' }],
            },
            { type: 'label', text: 'label text' },
          ],
        },
      },
      resolver: resolvers.page,
    })
    node = result.node as HTMLIFrameElement
    component = result.component
  })

  it(
    `should draw and attach each resolved component as children DOM nodes to ` +
      `node.contentDocument.body`,
    async () => {
      await waitFor(() => {
        expect(result.node.querySelector('img')).to.exist
        expect(result.node.querySelector('button')).to.exist
        expect(result.node.querySelector('label')).to.exist
      })
    },
  )
})

describe.only(`plugin`, () => {
  it(`should receive a function as the node argument`, () => {
    const spy = sinon.spy()
    const noodluidom = new NOODLUIDOM()
    noodluidom.register({ cond: 'plugin', resolve: spy })
    noodluidom.draw(createComponent({ type: 'plugin', path: 'abc.js' }))
    expect(spy.firstCall.args[0]).to.be.a('function')
  })

  it(`should use the argument node passed to the function as the final node`, () => {
    const node = document.createElement('div')
    node.id = 'hello'
    const noodluidom = new NOODLUIDOM()
    noodluidom.register({ cond: 'plugin', resolve: (getNode) => getNode(node) })
    noodluidom.draw(createComponent({ type: 'plugin', path: 'abc.js' }))
    console.info(document.body.children.length)
    expect(document.body.contains(node)).to.be.true
  })

  describe(`.html`, () => {
    xit(`should render the html to the DOM`, async () => {
      const html = '<div id="hello"><button class="abc">morning</button></div>'
      const fetch = window.fetch
      window.fetch = () => Promise.resolve(html)
      const noodlComponent = { type: 'plugin', path: 'abc.html' }
      const component = noodlui.resolveComponents(noodlComponent)
      const node = noodluidom.draw(component)
      await waitFor(() => {
        expect(document.body.contains(node)).to.be.true
      })
      window.fetch = fetch
    })
  })

  describe(`.css`, () => {
    xit(``, () => {
      //
    })
  })

  describe(`.js`, () => {
    describe(`noodl paths`, () => {
      xit(``, () => {
        //
      })
    })

    describe(`lib paths (outside of domain)`, () => {
      xit(``, () => {
        //
      })
    })
  })
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
    const sourceEl = applyMockDOMResolver({
      component: { type: 'video', path: 'asdloldlas.mp4', videoFormat: 'mp4' },
      resolver: resolvers.video,
    }).node?.querySelector('source')
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
