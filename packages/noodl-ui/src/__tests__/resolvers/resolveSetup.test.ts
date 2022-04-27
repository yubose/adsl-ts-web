import { expect } from 'chai'
import { waitFor } from '@testing-library/dom'
import * as nt from 'noodl-types'
import sinon from 'sinon'
import * as u from '@jsmanifest/utils'
import * as nu from 'noodl-utils'
import * as i from '../../utils/internal'
import * as t from '../../types'
import {
  assetsUrl,
  baseUrl,
  createOn,
  getRenderProps,
  nui,
  ui,
} from '../../utils/test-utils'
import { emitHooks } from '../../resolvers/resolveSetup'
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
        // @ts-expect-error
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
      it(`should resolve TargetPage@CurrentPage#viewTag`, async () => {
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

    describe(`reference`, () => {
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
        nui.getRootPage().page = 'Cereal'
        let [viewComponent] = await nui.resolveComponents({
          components: u.array(nui.getRoot().Cereal.components),
        })
        const pageComponent = viewComponent.child(1)
        const page = pageComponent.get('page') as NuiPage
        const components = await nui.resolveComponents({
          components: page.components,
          page,
          on: { reference: spy },
        })
        // @ts-expect-error
        const [_, __, textField] = components as t.NuiComponent.Instance[]
        textField.get('dataKey')
        const args = spy.args[0][0]
        expect(args).to.have.property('page').to.deep.eq(page)
      })

      describe(`when using the fallback reference resolvers`, () => {
        const getRoot = (components: any) => ({
          BaseHeader: { type: 'view', style: { shadow: 'true' } },
          Topo: {
            components: u.array(components),
          },
        })
        it(`should resolve whole component references`, async () => {
          const page = nui.getRootPage()
          page.page = 'Topo'
          nui.use({ getRoot: () => getRoot('.BaseHeader') })
          const [component] = await nui.resolveComponents({
            components: page.components,
            page,
          })
          expect(component).to.be.an('object')
          expect(component).to.have.property('type', 'view')
          expect(component.style).to.have.property('boxShadow').to.exist
          expect(component.style).not.to.have.property('shadow')
        })

        it(`should resolve components referenced by key and retain its component type`, async () => {
          const page = nui.getRootPage()
          page.page = 'Topo'
          nui.use({
            getRoot: () => ({
              BaseHeader: { type: 'view', style: { shadow: 'true' } },
              Topo: {
                components: [{ '.BaseHeader': '', viewTag: 'helloTag' }],
              },
            }),
          })
          const components = await nui.resolveComponents({
            components: page.components,
            page,
          })
          expect(components[0]).to.have.property('type', 'view')
        })

        xit(`should not overwrite current children if no children is on the retrieved object`, async () => {
          const renderProps = getRenderProps({
            pageName: 'Topo',
            root: {
              HaHeaderView: u.omit(ui.view({ style: { shadow: 'true' } }), [
                'children',
              ]),
              HaHeaderBigLabel1: ui.label('Soda'),
              NFont: { h1: '1.6vh' },
              SFont: { h4: '4.5vh' },
              Topo: {
                components: [
                  {
                    '.HaHeaderView': null,
                    style: { width: '0.68', height: '0.25' },
                    children: [
                      {
                        HaHeaderBigLabel1: null,
                        style: {
                          top: '0.0125',
                          left: '0.05',
                          fontSize: '.Sfont.h4',
                        },
                      },
                    ],
                  },
                ],
              },
            },
          })
          console.log(
            await nui.resolveComponents({
              components: renderProps.page.components,
              page: renderProps.page,
            }),
          )
          console.log(renderProps)
        })
      })
    })
  })

  describe(`async emits`, () => {
    async function resolveComponent(component: nt.ComponentObject) {
      const page = nui.createPage({
        name: 'Hello',
        viewport: { width: 375, height: 667 },
      })

      return {
        component: await nui.resolveComponents({ components: component, page }),
        page,
      }
    }

    it(`should only run the provided callback once per action`, async () => {
      const spy = sinon.spy()
      nui.use({ evalObject: spy })
      const { component } = await resolveComponent(
        ui.label({ onClick: [ui.evalObject(), ui.evalObject()] }),
      )
      // @ts-expect-error
      await component.get('onClick').execute({})
      await waitFor(() => expect(spy).to.be.calledTwice)
    })

    it(`should only run the provided callback once per emit action`, async () => {
      const trigger = 'onChange'
      const spy = sinon.spy()
      nui.use({ emit: { [trigger]: spy } })
      const { component } = await resolveComponent(
        ui.label({
          [trigger]: [ui.evalObject, ui.emitObject(), ui.evalObject],
        }),
      )
      // @ts-expect-error
      await component.get(trigger)?.execute({})
      await waitFor(() => expect(spy).to.be.calledOnce)
    })

    for (const obs of emitHooks) {
      const hookName = u.isObj(obs) ? obs.trigger : obs
      it(`should call on.emit.createActionChain hook with the expected args for "${hookName}"`, async () => {
        const spy = sinon.spy()
        await nui.resolveComponents({
          components: ui.label({
            [hookName]: ui.emitObject({
              dataKey: { var1: 'itemObject' },
              actions: [],
            }),
          }),
          on: { emit: { createActionChain: spy } },
        })
        const args = spy.args[0][0]
        expect(spy).to.be.calledOnce
        expect(args).to.be.an('object')
        expect(args).to.have.property('actionChain')
        expect(args).to.have.property('actions')
        expect(args).to.have.property('component')
        expect(args).to.have.property('trigger')
      })
    }
  })
})
