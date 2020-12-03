import _ from 'lodash'
import sinon from 'sinon'
import { waitFor } from '@testing-library/dom'
import { expect } from 'chai'
import { noodlui } from '../utils/test-utils'
import NOODLUI from '../noodl-ui'

describe.only('when working with plugins', () => {
  describe('when instantiating noodl-ui', () => {
    it('should give an option for plugin fetcher ', () => {
      const fetcher = sinon.spy()
      const head = ['https://someheadscript.com/head.html'] as any[]
      const body = {
        top: ['https://somebodyTOPsccript.com/bodytop.html'],
        bottom: ['https://somebodybottomscript.com/bodybot.html'],
      }
      const _noodlui = new NOODLUI({
        plugins: { fetcher, head, body },
      })
      const state = _noodlui.getState()
      expect(state.plugins.head).to.include(head[0])
      expect(state.plugins.body.top).to.include(body.top[0])
      expect(state.plugins.body.bottom).to.include(body.bottom[0])
    })

    xit('should fall back to window.fetch fetcher', () => {
      //
    })

    xit('should fall back to inserting to head if not explicitly provided', () => {
      // setPlugin
    })
  })

  describe('when resolving plugin components', () => {
    it('should insert to head if type is pluginHead', async () => {
      noodlui.resolveComponents({ type: 'pluginHead', path: 'abc123.png' })
      const url = noodlui.assetsUrl + 'abc123.png'
      await waitFor(() => {
        expect(noodlui.plugins('head')[0])
          .to.have.property('location')
          .eq('head')
        expect(noodlui.plugins('head')[0]).to.have.property('url').eq(url)
        expect(noodlui.plugins('head')[0]).to.have.property('content')
      })
    })

    it('should insert to beginning of the body if type is pluginBodyTop', async () => {
      noodlui.resolveComponents({ type: 'pluginBodyTop', path: 'abc123.png' })
      const url = noodlui.assetsUrl + 'abc123.png'
      await waitFor(() => {
        expect(noodlui.plugins('body-top')[0])
          .to.have.property('location')
          .eq('body-top')
        expect(noodlui.plugins('body-top')[0]).to.have.property('url').eq(url)
        expect(noodlui.plugins('body-top')[0]).to.have.property('content')
      })
    })

    it('should insert to the end of the body if the type is pluginBodyTail', async () => {
      noodlui
        .use({ fetch: async () => 'Hello!' })
        .resolveComponents({ type: 'pluginBodyTail', path: 'abc123.png' })
      const url = noodlui.assetsUrl + 'abc123.png'
      await waitFor(() => {
        expect(noodlui.plugins('body-bottom')[0])
          .to.have.property('location')
          .eq('body-bottom')
        expect(noodlui.plugins('body-bottom')[0])
          .to.have.property('url')
          .eq(url)
        expect(noodlui.plugins('body-bottom')[0]).to.have.property('content')
      })
    })

    it('should fetch the contents of plugins and set them in their plugin object', async () => {
      noodlui
        .use({ fetch: async () => 'Heffwfwallo!' })
        .resolveComponents({ type: 'pluginBodyTail', path: 'abc123.png' })
      await waitFor(() => {
        expect(noodlui.plugins('body-bottom')[0])
          .to.have.property('content')
          .eq('Heffwfwallo!')
      })
    })
  })
})
