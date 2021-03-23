import { waitFor } from '@testing-library/dom'
import { expect } from 'chai'

describe('when working with plugins', () => {
  describe('when instantiating noodl-ui', () => {
    xit('should fall back to window.fetch fetcher', () => {
      //
    })

    xit('should fall back to inserting to head if not explicitly provided', () => {
      // setPlugin
    })
  })

  describe('when resolving plugin components', () => {
    xit('should insert to head if type is pluginHead', async () => {
      noodlui.use({ plugins: [{ type: 'pluginHead', path: 'abc123.png' }] })
      await waitFor(() => {
        expect(noodlui.plugins('head')[0])
          .to.have.property('location')
          .eq('head')
        expect(noodlui.plugins('head')[0])
          .to.have.property('path')
          .eq('abc123.png')
        expect(noodlui.plugins('head')[0]).to.have.property('content')
      })
    })

    it('should insert to beginning of the body if type is pluginBodyTop', async () => {
      noodlui.use({ plugins: [{ type: 'pluginBodyTop', path: 'abc123.png' }] })
      await waitFor(() => {
        expect(noodlui.plugins('body-top')[0])
          .to.have.property('location')
          .eq('body-top')
        expect(noodlui.plugins('body-top')[0])
          .to.have.property('path')
          .eq('abc123.png')
        expect(noodlui.plugins('body-top')[0]).to.have.property('content')
      })
    })

    it('should insert to the end of the body if the type is pluginBodyTail', async () => {
      noodlui.use({
        fetch: async () => 'Hello!',
        plugins: [{ type: 'pluginBodyTail', path: 'abc123.png' }],
      })
      await waitFor(() => {
        expect(noodlui.plugins('body-bottom')[0])
          .to.have.property('location')
          .eq('body-bottom')
        expect(noodlui.plugins('body-bottom')[0])
          .to.have.property('path')
          .eq('abc123.png')
        expect(noodlui.plugins('body-bottom')[0]).to.have.property('content')
      })
    })

    xit('should fetch the contents of plugins and set them in their plugin object', async () => {
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
