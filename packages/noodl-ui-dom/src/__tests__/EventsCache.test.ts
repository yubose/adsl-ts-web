import { expect } from 'chai'
import { prettyDOM, waitFor } from '@testing-library/dom'
import sinon from 'sinon'
import { coolGold, italic } from 'noodl-common'
import * as mock from 'noodl-ui-test-utils'
import { createRender, ndom } from '../test-utils'
import EventsCache from '../cache/EventsCache'

describe(coolGold(`EventsCache`), () => {
  describe(italic(`get`), () => {
    it(`should initiate a new EventsMap and EventsItem[] list if not existent`, async () => {
      const evtKey = 'click'
      const { render } = createRender({
        components: [
          mock.getButtonComponent({ onClick: [mock.getEmitObject()] }),
        ],
      })
      const component = await render()
      const node = document.getElementById(component.id)
      const evts = ndom.global.evts
      expect(node?.id).to.exist
      expect(evts.has(node?.id, evtKey)).to.be.true
      expect(evts.get(node?.id, evtKey)).to.be.an('array')
      await waitFor(() => {
        expect(evts.get(node?.id, evtKey)).to.have.length.greaterThan(0)
      })
    })
  })
})
