import * as mock from 'noodl-ui-test-utils'
import * as nc from 'noodl-common'
import sinon from 'sinon'
import nock from 'nock'
import { prettyDOM, waitFor } from '@testing-library/dom'
import { expect } from 'chai'
import {
  ndom,
  createRender,
  createMockCssResource,
  createMockJsResource,
} from '../test-utils'
import { GlobalCssResourceRecord, GlobalJsResourceRecord } from '../global'

let cssResource = createMockCssResource()
let jsResource = createMockJsResource()

const getMockGlobalCssNode = (queryType?: 'all') => {
  const selector = `link[href="${cssResource.href}"]`
  if (queryType === 'all') return document.head.querySelectorAll(selector)
  return document.getElementById(cssResource.href)
}

const getMockGlobalJsNode = (queryType?: 'all') => {
  const selector = `script[src="${jsResource.src}"]`
  if (queryType === 'all') return document.body.querySelectorAll(selector)
  return document.getElementById(jsResource.src)
}

beforeEach(() => {
  cssResource = createMockCssResource()
  jsResource = createMockJsResource()
  nock(/some-mock-link/i)
    .get(/chart.min/i)
    .reply(200)
})

describe(nc.coolGold(`resources`), () => {
  describe(nc.italic(`when using ${nc.yellow(`ndom.use`)}`), () => {
    it(`should load the resource(s) to the global map`, () => {
      ndom.use({ resource: [cssResource, jsResource] })
      expect(ndom.global.resources.css).to.have.property(cssResource.href)
      expect(ndom.global.resources.js).to.have.property(jsResource.src)
    })

    it(`should create a GlobalCssResourceRecord`, () => {
      expect(ndom.global.resources.css).not.to.have.property(cssResource.href)
      ndom.use({ resource: cssResource })
      expect(ndom.global.resources.css).to.have.property(cssResource.href)
    })

    it(`should create a GlobalJsResourceRecord`, () => {
      expect(ndom.global.resources.js).not.to.have.property(jsResource.src)
      ndom.use({ resource: jsResource })
      expect(ndom.global.resources.js).to.have.property(jsResource.src)
    })

    it(`should call onCreateRecord if provided`, () => {
      const spy = sinon.spy()
      ndom.use({ resource: { ...jsResource, onCreateRecord: spy as any } })
      expect(spy).to.be.calledOnce
      expect(spy.args[0][0]).to.be.instanceOf(GlobalJsResourceRecord)
    })

    it(`should call onLoad with the DOM node and record if loadToDOM is true`, async () => {
      const spy = sinon.spy()
      const { ndom, render } = createRender({
        pageName: 'Hello',
        components: [mock.getButtonComponent()],
        resource: { ...cssResource, onLoad: spy as any, loadToDOM: true },
      })
      await render()
      await waitFor(() => {
        expect(spy).to.be.calledOnce
        // expect(spy.args[0][0])
        //   .to.have.property('node')
        //   .instanceOf(HTMLLinkElement)
        // expect(spy.args[0][0])
        //   .to.have.property('record')
        //   .to.be.instanceOf(GlobalCssResourceRecord)
      })
    })

    it(`should not create and load an element to the DOM if loadToDOM is not true`, async () => {
      ndom.use({ resource: cssResource })
      await waitFor(() => expect(getMockGlobalCssNode()).to.be.null)
      ndom.use({
        resource: { ...cssResource, loadToDOM: true },
      })
      await waitFor(() => expect(getMockGlobalCssNode()).not.to.be.null)
    })
  })

  it(`should load the resources to the DOM when calling render, if it isnt already in it`, async () => {
    const { render } = createRender({
      pageName: 'Hello',
      components: [mock.getButtonComponent()],
      resource: cssResource,
    })
    expect(getMockGlobalCssNode()).to.be.null
    await render()
    await waitFor(() => {
      expect(document.head.children).to.have.length.greaterThan(0)
      expect(getMockGlobalCssNode()).not.to.be.null
    })
  })

  it(`should not load scripts twice`, async () => {
    const { render } = createRender({
      components: [mock.getVideoComponent()],
      resource: [cssResource, jsResource],
    })
    expect(getMockGlobalCssNode()).to.be.null
    expect(getMockGlobalJsNode()).to.be.null
    await render()
    await waitFor(() => {
      expect(getMockGlobalCssNode('all')).to.have.property('length').to.eq(1)
      expect(getMockGlobalJsNode('all')).to.have.property('length').to.eq(1)
    })
  })

  it(`should call the onResource hook function after their resources are appended to the DOM`, async () => {
    const spy = sinon.spy()
    const { render } = createRender({
      components: [mock.getButtonComponent()],
    })
    expect(getMockGlobalJsNode()).to.be.null
    ndom.use({
      resolver: {
        resource: jsResource,
        resolve: { onResource: { [jsResource.src]: spy } },
      },
    })
    expect(getMockGlobalJsNode()).to.be.null
    await render()
    await waitFor(() => {
      expect(getMockGlobalJsNode()).not.to.be.null
      expect(spy).to.be.calledOnce
    })
  })

  it(`should render elements to the DOM only after their resource(s) are in the DOM`, (done) => {
    const { render } = createRender({
      components: [mock.getButtonComponent({ id: 'hellobtn' })],
    })
    expect(getMockGlobalJsNode()).to.be.null
    ndom.use({
      resolver: {
        resource: jsResource,
        resolve: {
          onResource: {
            [jsResource.src]({ node, resource }) {
              expect(document.body.contains(resource.node)).to.be.true
              done()
            },
          },
        },
      },
    })
    expect(getMockGlobalJsNode()).to.be.null
    render()
  })

  xit(`should not render elements to the DOM if their resource(s) are not loaded yet`, () => {
    //
  })

  xit(`should pass the component, node, options, and record's node/record instance to args`, () => {
    //
  })
})
