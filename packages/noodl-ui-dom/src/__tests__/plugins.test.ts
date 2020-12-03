import sinon from 'sinon'
import nock from 'nock'
import { prettyDOM, waitFor } from '@testing-library/dom'
import { expect } from 'chai'
import { NOODLComponent, ComponentObject } from 'noodl-ui'
import { noodlui, noodluidom, toDOM } from '../test-utils'

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
    nodes.forEach((scriptNode) => {
      expect(scriptNode.style.position).to.eq('')
      expect(scriptNode.style.outline).to.eq('')
      expect(scriptNode.id).to.be.a('string').of.length.greaterThan(0)
      expect(scriptNode.src).to.eq('')
    })
  })

  it('should insert pluginHead components to head', async () => {
    const node = noodluidom.parse(noodlui.resolveComponents(pluginHead))
    await waitFor(() => {
      expect(document.head.contains(node)).to.be.true
      expect(document.body.contains(node)).to.be.false
      console.info(prettyDOM(document.documentElement))
    })
  })

  it('should insert pluginBodyTop components to beginning of body', async () => {
    document.body.innerHTML =
      '<li>Hello</li>' + '<li>Hello</li>' + '<li>Hello</li>'
    const node = noodluidom.parse(noodlui.resolveComponents(pluginBodyTop))
    await waitFor(() => {
      expect(document.body.firstChild).to.eq(node)
    })
  })

  it('should insert pluginBodyTop components to the end of body', async () => {
    document.body.innerHTML =
      '<li>Hello</li>' + '<li>Hello</li>' + '<li>Hello</li>'
    const node = noodluidom.parse(noodlui.resolveComponents(pluginBodyTail))
    await waitFor(() => {
      expect(document.body.lastChild).to.eq(node)
    })
  })

  it('should be able to globally access all plugin components', () => {
    expect(noodluidom.plugins()).to.have.property('head')
    expect(noodluidom.plugins()).to.have.property('body')
  })

  // Already handled in noodl-ui
  xit('should fetch the url content immediately by default', async () => {
    const pluginContent = '<script>console.info("You got me")</script>'
    nock(noodlui.assetsUrl)
      .get(('/' + pluginHead.path) as string)
      .reply(200, pluginContent)
    const node = noodluidom.parse(noodlui.resolveComponents(pluginHead))
    await waitFor(() => {
      const plugin = noodluidom.plugins('head')[0]
      expect(plugin).to.exist
      expect(plugin).to.have.property('content').eq(pluginContent)
    })
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

  it('should be able to form a plugin object and retain all the plugin props', async () => {
    let plugin: any
    const pluginContent = '<script>console.info("You got me")</script>'
    const component = noodlui.resolveComponents(pluginHead)
    // We are setting the content here because noodl-ui resolves the content
    // Since we shouldn't test 3rd party libs, we will quickly just set the content ourselves
    component.set('content', pluginContent)
    noodluidom.parse(component)
    await waitFor(() => {
      plugin = noodluidom.plugins('head')[0]
      expect(plugin).to.exist
      expect(plugin).to.have.property('location').eq('head')
    })
    expect(plugin)
      .to.have.property('url')
      .eq(noodlui.assetsUrl + pluginHead.path)
    expect(plugin).to.have.property('content').eq(pluginContent)
  })
})
