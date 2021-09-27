import { expect } from 'chai'
import { waitFor } from '@testing-library/dom'
import sinon from 'sinon'
import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import * as nu from 'noodl-utils'
import * as i from '../../utils/internal'
import { assetsUrl, baseUrl, createOn, nui, ui } from '../../utils/test-utils'
import NuiPage from '../../Page'

let on: ReturnType<typeof createOn>

beforeEach(() => {
  on = createOn(nui.getRoot)
})

describe(u.yellow(`resolveSetup`), () => {
  describe(u.italic('on'), () => {
    describe(`if`, () => {
      it(`should return value at index 1 if true`, async () => {
        const [component] = await nui.resolveComponents({
          components: [ui.label({ text: { if: [1, 'abc', 'wow'] } })],
          on: { if: () => true },
        })
        expect(component.get('text')).to.eq('abc')
      })

      it(`should return value at index 2 if false`, async () => {
        const component = await nui.resolveComponents({
          components: ui.label({ text: { if: [1, 'abc', 'wow'] } }),
          on: { if: () => false },
        })
        expect(component.get('text')).to.eq('wow')
      })

      it(`should run the reference hook if the truthy/falsy value returns a reference`, async () => {
        const spy = sinon.spy()
        const component = await nui.resolveComponents({
          components: ui.label({
            text: { if: [1, '..formData.password', 'wow'] },
          }),
          on: { if: () => true, reference: spy },
        })
        component.get('text')
        expect(spy).to.be.calledOnce
      })

      it(`should be able to deeply resolve references`, async () => {
        nui.getRoot().Power = { patientInfoPage: '.Sun.viewTag' }
        const component = await nui.resolveComponents({
          components: ui.label({
            text: { if: [1, '.Power.patientInfoPage', 'wow'] },
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
        ;(
          await nui.resolveComponents({
            components: ui.label({ text: '..formData.password' }),
            on: { reference: spy },
          })
        ).get('text')
        expect(spy).to.be.calledOnce
      })

      it(`should use the fallback reference resolver if no hook resolver is provided`, async () => {
        expect(
          (
            await nui.resolveComponents({
              components: ui.label({ text: '..formData.password' }),
            })
          ).get('text'),
        ).to.eq(nui.getRoot().Hello.formData.password)
      })

      it(`should pass in a page instance to args`, async () => {
        const spy = sinon.spy()
        ;(
          await nui.resolveComponents({
            components: ui.label({ text: '..formData.password' }),
            on: { reference: spy },
          })
        ).get('text')
        expect(spy.args[0][0])
          .to.have.property('page')
          .to.be.instanceOf(NuiPage)
      })

      it(`should pass in the correct page instance to a descendant of a page component`, async () => {
        const spy = sinon.spy()
        let [viewComponent] = await nui.resolveComponents({
          components: u.array(nui.getRoot().Cereal.components),
        })
        const pageComponent = viewComponent.child(1)
        const page = pageComponent.get('page') as NuiPage
        let textField = (
          await nui.resolveComponents({
            components: page.components,
            page,
            on: { reference: spy },
          })
        )[2]
        textField.get('dataKey')
        const args = spy.args[0][0]
        expect(args).to.have.property('page').to.deep.eq(page)
      })
    })
  })
})
