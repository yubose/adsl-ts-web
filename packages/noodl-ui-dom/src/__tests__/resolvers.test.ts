import chalk from 'chalk'
import sinon from 'sinon'
import { enableES5 } from 'immer'
import { ComponentObject } from 'noodl-types'
import {
  ComponentInstance,
  createComponent,
  getStore,
  List,
  ListItem,
  NOODLComponent,
} from 'noodl-ui'
import { prettyDOM, waitFor } from '@testing-library/dom'
import { expect } from 'chai'
import { applyMockDOMResolver, noodlui, ndom, toDOM } from '../test-utils'
import { eventId } from '../constants'
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

before(() => {
  enableES5()
})

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
    component.children.forEach((child: any) => {
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

  xit(
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

describe.skip(`plugin`, () => {
  it(`should receive a function as the node argument`, () => {
    const spy = sinon.spy()
    const ndom = new NOODLUIDOM()
    ndom.register({ cond: 'plugin', resolve: spy })
    ndom.draw(createComponent({ type: 'plugin', path: 'abc.js' }))
    expect(spy.firstCall.args[0]).to.be.a('function')
  })

  it(`should use the argument node passed to the function as the final node`, () => {
    const node = document.createElement('div')
    node.id = 'hello'
    const ndom = new NOODLUIDOM()
    ndom.register({ cond: 'plugin', resolve: (getNode) => getNode(node) })
    ndom.draw(createComponent({ type: 'plugin', path: 'abc.js' }))
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
      const node = ndom.draw(component)
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

describe.only(`styles`, () => {
  let ndom: NOODLUIDOM

  beforeEach(() => {
    ndom = new NOODLUIDOM()
    ndom.use(noodlui)
  })

  describe(`Positioning / Sizing`, () => {
    describe(
      `when a component's "top" is being treated as "auto" (a.k.a it was not ` +
        `explicitly set as a positional value like "0.2")`,
      () => {
        const finalKeys = ['top', 'height']

        it(`should always set a value for top, height, and marginTop`, async () => {
          const componentObj = {
            type: 'view',
            style: { width: '1', height: '1', top: '0', left: '0' },
            children: [
              { type: 'label', style: { top: '0.2' }, text: 'Good morning' },
              { type: 'button', style: { width: '0.2' }, text: 'Submit' },
            ],
          } as ComponentObject

          ndom.page.on(eventId.page.on.ON_BEFORE_RENDER_COMPONENTS, () => ({
            object: { components: [componentObj] },
          }))

          const {
            snapshot: { components },
          } = await ndom.page.requestPageChange('Hello')

          const label = components[0].child()
          const button = components[0].child(1)
          const testSubjects = [components[0], label, button]

          testSubjects.forEach((component) => {
            expect(component.style).to.have.property('marginTop').to.exist
            expect(component.style).to.have.property('top').to.exist
            expect(component.style).to.have.property('height').to.exist
          })
        })

        it.only(
          `should always set the first child to have the same value of ` +
            `the parent's top position in the DOM`,
          async () => {
            const componentObj = {
              type: 'view',
              style: { width: '1', height: '1', top: '0.3', left: '0' },
              children: [
                { type: 'label', style: {}, text: 'Good morning' },
                { type: 'button', style: { width: '0.2' }, text: 'Submit' },
              ],
            } as ComponentObject

            ndom.page.on(eventId.page.on.ON_BEFORE_RENDER_COMPONENTS, () => ({
              object: { components: componentObj },
            }))

            const {
              snapshot: { components },
            } = await ndom.page.requestPageChange('Hello')

            const parent = components[0]
            const child1 = parent.child()
            const parentNode = document.getElementById(parent.id) as any
            const child1Node = document.getElementById(child1.id) as any

            expect(parent.style).to.have.property('top').to.eq(child1.style.top)
            expect(parentNode.style)
              .to.have.property('top')
              .to.eq(child1Node.style.top)
          },
        )

        it(
          `should not make the second child follow the first child logic but ` +
            `instead compute its top position using the first child's calculated ` +
            `top + height value`,
          async () => {
            const componentObj = {
              type: 'view',
              style: { width: '1', height: '1', top: '0.3', left: '0' },
              children: [
                { type: 'label', style: {}, text: 'Good morning' },
                { type: 'button', style: { width: '0.2' }, text: 'Submit' },
              ],
            } as ComponentObject

            ndom.page.on(eventId.page.on.ON_BEFORE_RENDER_COMPONENTS, () => ({
              object: { components: componentObj },
            }))

            const {
              snapshot: { components },
            } = await ndom.page.requestPageChange('Hello')

            const parent = components[0]
            const child1 = parent.child(1)
            const child2 = parent.child(1)

            const parentNode = document.getElementById(parent.id) as any
            const child1Node = document.getElementById(child1.id) as any
            const child2Node = document.getElementById(child2.id) as any

            expect(parentNode.style)
              .to.have.property('top')
              .to.not.to.eq(child2Node.style.top)
            // expect(child2Node).to.have.property('top').to.eq(child1Node)
            console.info(parentNode.style.top)
            console.info(child1Node.style.top)
            console.info(child2Node.style.top)
            console.info(parentNode.style.height)
            console.info(child1Node.style.height)
            console.info(child2Node.style.height)
          },
        )

        finalKeys.forEach((key) => {
          xit(`should treat ${key} as "auto" if it is missing`, () => {})
        })

        it(`should set marginTop to "0px" if it is missing`, async () => {
          const componentObj = {
            type: 'view',
            style: { width: '1', height: '1', top: '0.3', left: '0' },
          } as ComponentObject

          ndom.page.on(eventId.page.on.ON_BEFORE_RENDER_COMPONENTS, () => ({
            object: { components: componentObj },
          }))

          const {
            snapshot: { components },
          } = await ndom.page.requestPageChange('Hello')

          const component = components[0]
          expect(component.style).to.have.property('marginTop').to.to.eq('0px')
        })

        xit(
          `should set the child to have the same top as its previous sibling ` +
            `if it is set to "align"`,
          () => {
            //
          },
        )
      },
    )

    it(`should save last used top to lastTop render state`, async () => {
      const component = {
        type: 'view',
        style: { width: '1', height: '1', top: '0', left: '0' },
        children: [
          {
            type: 'view',
            style: {
              top: '0.125',
              left: '0.1',
              height: '0.05',
              width: '0.01',
            },
            children: [
              { type: 'label', style: { top: '0.2' }, text: 'Good morning' },
              { type: 'button', style: { width: '0.2' }, text: 'Submit' },
            ],
          },
        ],
      } as ComponentObject

      ndom.page.on(eventId.page.on.ON_BEFORE_RENDER_COMPONENTS, () => ({
        object: { components: [component] },
      }))

      const result = await ndom.page.requestPageChange('Hello')
      // console.info(prettyDOM())
      console.info(ndom.state)
    })

    it(
      `should be reachable to look at for its dimensions when the child ` +
        `is resolving its positioning`,
      () => {
        //
      },
    )

    describe(`when missing top`, () => {
      xit(`should take the last top that was known`, () => {
        //
      })
    })

    describe(`when missing height`, () => {
      xit(`should `, () => {
        //
      })
    })

    describe(`when missing both top and height`, () => {
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
