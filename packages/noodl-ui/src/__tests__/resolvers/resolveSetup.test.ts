import { expect } from 'chai'
import { waitFor } from '@testing-library/dom'
import sinon from 'sinon'
import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import * as nu from 'noodl-utils'
import { assetsUrl, baseUrl, createOn, nui, ui } from '../../utils/test-utils'
import * as i from '../../utils/internal'

let on: ReturnType<typeof createOn>

beforeEach(() => {
  on = createOn(nui.getRoot)
})

describe.only(u.yellow(`resolveSetup`), () => {
  describe(u.italic('on'), () => {
    describe(`if`, () => {
      it(`should return value at index 1 if true`, async () => {
        const [component] = await nui.resolveComponents({
          components: [ui.label({ text: ui.ifObject([1, 'abc', 'wow']) })],
          on: { if: () => true },
        })
        expect(component.get('text')).to.eq('abc')
      })

      it(`should return value at index 2 if false`, async () => {
        const component = await nui.resolveComponents({
          components: ui.label({ text: ui.ifObject([1, 'abc', 'wow']) }),
          on: { if: () => false },
        })
        expect(component.get('text')).to.eq('wow')
      })

      it(`should run the reference hook if the truthy/falsy value returns a reference`, async () => {
        const spy = sinon.spy()
        const component = await nui.resolveComponents({
          components: ui.label({
            text: ui.ifObject([1, '..formData.password', 'wow']),
          }),
          on: { if: () => true, reference: spy },
        })
        component.get('text')
        expect(spy).to.be.calledOnce
      })

      it(`should be able to deeply resolve references`, async () => {
        u.assign(nui.getRoot(), {
          Power: { patientInfoPage: '.Sun.viewTag' },
          Sun: { viewTag: '.Hello.formData.password' },
        })
        const component = await nui.resolveComponents({
          components: ui.label({
            text: ui.ifObject([1, '.Power.patientInfoPage', 'wow']),
          }),
        })
        expect(component.get('text')).to.eq(
          nui.getRoot().Hello.formData.password,
        )
      })
    })

    describe(`pageComponentUrl`, () => {
      describe(`TargetPage@CurrentPage#viewTag`, () => {
        it(`should use the hook reference if found`, async () => {
          const spy = sinon.spy()
          const component = await nui.resolveComponents({
            components: ui.label({
              goto: '.Power.patientInfoPage@Sun#.Sun.viewTag',
            }),
            on: { pageComponentUrl: spy },
          })
          component.get('goto')
          expect(spy).to.be.calledOnce
        })

        it(`should use the fallback pageComponentUrl resolver if no hook resolver is provided`, async () => {
          u.assign(nui.getRoot(), {
            Power: { patientInfoPage: 'Rawr' },
            Sun: { viewTag: '.Hello.formData.password' },
          })
          const component = await nui.resolveComponents({
            components: ui.label({
              goto: '.Power.patientInfoPage@Sun#..formData.password',
            }),
          })
          const result = component.get('goto')
          expect(result).to.eq(
            `Rawr@Sun#${nui.getRoot().Hello.formData.password}`,
          )
        })
      })
    })

    describe(`reference`, () => {
      it(`should use the hook reference if found`, async () => {
        const spy = sinon.spy()
        const component = await nui.resolveComponents({
          components: ui.label({ text: '..formData.password' }),
          on: { reference: spy },
        })
        component.get('text')
        expect(spy).to.be.calledOnce
      })

      it(`should use the fallback reference resolver if no hook resolver is provided`, async () => {
        const component = await nui.resolveComponents({
          components: ui.label({ text: '..formData.password' }),
        })
        component.get('text')
        expect(component.get('text')).to.eq(
          nui.getRoot().Hello.formData.password,
        )
      })
    })
  })
})
