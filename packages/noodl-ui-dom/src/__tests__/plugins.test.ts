import sinon from 'sinon'
import nock from 'nock'
import { prettyDOM, screen, waitFor } from '@testing-library/dom'
import { expect } from 'chai'
import {
  createComponent,
  Component,
  NOODLComponent,
  ProxiedComponent,
  ComponentObject,
} from 'noodl-ui'
import { assetsUrl, noodlui, noodluidom, toDOM } from '../test-utils'
import { getShape, getShapeKeys } from '../utils'

let pluginHead: ComponentObject
let pluginBodyTop: ComponentObject
let pluginBodyTail: ComponentObject

beforeEach(() => {
  pluginHead = { type: 'pluginHead', path: 'headplugin.html' }
  pluginBodyTop = { type: 'pluginBodyTop', path: 'bodytopplugin.html' }
  pluginBodyTail = {
    type: 'pluginBodyTail',
    path: 'bodytailplugin.html',
  }
})

describe.only('plugins', () => {
  it('should receive null as the "DOM node" in the callback', () => {
    nock('https://what.com', { reqheaders: { origin: '*' } })
      .get('/what.jpg')
      .reply(200, 'congrats')
    const spy = sinon.spy()
    const component = {
      id: '123',
      type: 'plugin',
      noodlType: 'plugin',
      path: 'https://what.com/what.jpg',
    } as NOODLComponent
    noodluidom.on('plugin', spy)
    noodluidom.parse(noodlui.resolveComponents(component), document.body)
    expect(spy.firstCall.args[0]).to.be.null
    expect(spy.firstCall.args[1]).not.to.be.null
  })

  it('should emit plugin event for pluginHead, pluginBodyTop, pluginBodyTail', () => {
    const emitHead = sinon.spy()
    const emitBodyTop = sinon.spy()
    const emitBodyTail = sinon.spy()
    noodluidom.on('pluginHead', emitHead)
    noodluidom.on('pluginBodyTop', emitBodyTop)
    noodluidom.on('pluginBodyTail', emitBodyTail)
    const view = noodlui.resolveComponents({
      type: 'view',
      children: [pluginHead, pluginBodyTop, pluginBodyTail],
    })
    expect(emitHead.called).to.be.false
    expect(emitBodyTop.called).to.be.false
    expect(emitBodyTail.called).to.be.false
    toDOM(view)
    expect(emitHead.called).to.be.true
    expect(emitBodyTop.called).to.be.true
    expect(emitBodyTail.called).to.be.true
  })

  it('should be dom nodes of "script"', () => {
    const view = noodlui.resolveComponents({
      type: 'view',
      children: [pluginHead, pluginBodyTop, pluginBodyTail],
    })
    const [s1, s2, s3] = view.children()
    toDOM(view)
    expect(document.getElementById(s1.id)?.tagName).to.eq('SCRIPT')
    expect(document.getElementById(s2.id)?.tagName).to.eq('SCRIPT')
    expect(document.getElementById(s3.id)?.tagName).to.eq('SCRIPT')
  })

  it('should not give any styles or attributes besides id', () => {
    toDOM(
      noodlui.resolveComponents({
        type: 'view',
        children: [pluginHead, pluginBodyTop, pluginBodyTail],
      }),
    )
    const nodes = Array.from(document.querySelectorAll('script'))
    console.info(prettyDOM())
    nodes.forEach((scriptNode) => {
      expect(scriptNode.style.position).to.eq('')
      expect(scriptNode.style.outline).to.eq('')
      expect(scriptNode.id).to.be.a('string').of.length.greaterThan(0)
      expect(scriptNode.src).to.eq('')
    })
  })

  it('should insert pluginHead components to head', () => {
    const node = toDOM(pluginHead)
    expect(document.head.contains(node)).to.be.true
    expect(document.body.contains(node)).to.be.false
  })

  xit('should insert pluginBodyTop components to beginning of body', () => {
    //
  })

  xit('should insert pluginBodyTop components to the end of body', () => {
    //
  })

  xit('should be able to globally access all plugin components', () => {
    //
  })

  xit('should start fetching the url content immediately by default', () => {
    //
  })

  describe('when using the life cycle api', () => {
    xit('should be able to explicitly set to load before parsing components', () => {
      //
    })

    xit('should be able to explicitly set to load after parsing components', () => {
      //
    })

    xit(
      'should be able to explicitly set to load when certain components are ' +
        'being rendered to the DOM',
      () => {
        //
      },
    )

    xit('should emit an event "before fetching"', () => {
      //
    })

    xit('should emit an event "after fetching"', () => {
      //
    })

    xit('should emit an event "data received from fetching"', () => {
      //
    })
  })

  xit("should be able to access a plugin's loaded contents any time", () => {
    //
  })

  xit('should show the timestamp and location in the api system that the plugin was fetched', () => {
    //
  })

  xit('should be able to fetch the url content in ', () => {
    //
  })
})
