import { expect } from 'chai'
import { waitFor } from '@testing-library/dom'
import sinon from 'sinon'
import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import * as nu from 'noodl-utils'
import * as i from '../utils/internal'
import * as s from '../utils/style'
import {
  assetsUrl,
  baseUrl,
  createRender,
  getRenderProps,
  getDefaultViewportWidthHeight,
  nui,
  ui,
} from '../utils/test-utils'
import NuiPage from '../Page'
import log from '../utils/log'
import normalizeProps from '../normalizeProps'

const render = createRender()

describe('normalizeProps', () => {
  describe(`select`, () => {
    let root: Record<string, any>
    let normalize = (comp: Partial<nt.SelectComponentObject>) =>
      normalizeProps({}, ui.select(comp), { root, pageName: 'SignIn' })

    beforeEach(() => {
      root = {
        SignIn: {
          selectedOption: '2AM',
          profile: { options: ['1AM', '2AM', '3AM'] },
        },
      }
    })

    it(`should parse select options into data-options`, () => {
      expect(
        normalize({ dataKey: '..profile.options', options: '' }),
      ).to.have.property('data-options')
    })

    //
    ;['.SignIn.selectedOption', 'SignIn.selectedOption'].forEach((ref) => {
      it(`should set the data-value if dataKey is "${ref}"`, () => {
        expect(normalize({ dataKey: ref }))
          .to.have.property('data-value')
          .deep.eq(root.SignIn.selectedOption)
      })
    })

    xit(`should parse options references`, () => {
      expect(normalizeProps({ options: 'SignIn.profile.options' }))
        .to.have.property('options')
        .deep.eq(['1AM', '2AM', '3AM'])
    })

    xit(`should format options to arrays if it isnt already an array`, () => {
      //
    })
  })

  describe(`styles`, () => {
    describe(`fontSize`, () => {
      const getComponent = (fontSize: string) =>
        ui.button({ style: { fontSize } })

      const getOptions = (opts?: Parameters<typeof normalizeProps>[2]) => ({
        viewport: getDefaultViewportWidthHeight(),
        ...opts,
      })

      describe(`vw/vh`, () => {
        it(`should return back the original value if viewport dimensions are missing`, () => {
          expect(
            normalizeProps({}, getComponent('2.8vh')).style,
          ).to.have.property('fontSize', '2.8vh')
        })

        it(`should set the right size`, () => {
          const fontSize = normalizeProps(
            {},
            getComponent('2.8vh'),
            getOptions(),
          )?.style?.fontSize
          expect(s.toNum(fontSize, 1)).to.eq(21.5)
        })

        it(`should set the right size from local references`, () => {
          const fontSize = normalizeProps(
            {},
            getComponent('..f'),
            getOptions({ pageName: 'Topo', root: { Topo: { f: '2.8vh' } } }),
          )?.style?.fontSize
          expect(s.toNum(fontSize, 1)).to.eq(21.5)
        })

        it(`should set the right size from root references`, () => {
          const fontSize = normalizeProps(
            {},
            getComponent('.Topo.f'),
            getOptions({ pageName: 'Topo', root: { Topo: { f: '2.8vh' } } }),
          )?.style?.fontSize
          expect(s.toNum(fontSize, 2)).to.eq(21.5)
        })

        it(`should return the value in vw/vh if keepVpUnit === true`, () => {
          const fontSize = normalizeProps(
            {},
            getComponent('.Topo.f'),
            getOptions({
              pageName: 'Topo',
              root: { Topo: { f: '4vh' } },
              viewport: { height: 768, width: 1024 },
            }),
          )?.style?.fontSize
          // expect(s.toNum(fontSize, 2)).to.eq(21.5)
          log.info(fontSize)
        })
      })
    })
  })
})
