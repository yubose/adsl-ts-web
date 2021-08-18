import { expect } from 'chai'
import { waitFor } from '@testing-library/dom'
import {
  ComponentObject,
  PageComponentObject,
  PageObject,
  ViewComponentObject,
} from 'noodl-types'
import { flatten as flattenComponents, Page as NUIPage } from 'noodl-ui'
import * as u from '@jsmanifest/utils'
import * as nc from 'noodl-common'
import { event as nuiEvent, NUI, NUIComponent } from 'noodl-ui'
import {
  _defaults,
  createRender as _createRender,
  getPageComponentChildIds,
  ui,
  ndom,
  waitForPageChildren,
} from '../test-utils'
import { findByElementId, findBySelector, getFirstByElementId } from '../utils'
import { cache } from '../nui'

describe(nc.coolGold('components'), () => {
  describe(nc.italic(`Page`), () => {
    let Donut: PageObject
    let Cereal: PageObject
    let Hello: PageObject
    let viewComponentObject: ViewComponentObject
    let pageComponentObject: PageComponentObject
    let formData = { password: 'fruits' }
    let submitMessage = 'Press submit to proceed'
    let listData = [
      { firstName: 'Mike', gender: 'Male' },
      { firstName: 'Lisa', gender: 'Feale' },
      { firstName: 'Brit', gender: 'Female' },
    ] as const

    beforeEach(() => {
      Donut = {
        formData,
        components: [
          {
            type: 'view',
            id: 'donutContainer',
            children: [
              ui.textField({
                id: 'donutInput',
                onChange: [
                  ui.emitObject({
                    dataKey: 'Donut.formData.password',
                  }) as any,
                ],
              }),
              ui.button({
                id: 'b',
                text: `Go to Donut page`,
                onClick: [ui.gotoObject('Donut')],
              }),
              ui.divider({ id: 'divider' }),
              ui.label({
                id: 'label',
                text: '..fullName',
              }),
            ],
          },
        ],
      }
      Cereal = {
        submitMessage,
        components: [
          {
            viewTag: 'cerealView',
            type: 'view',
            children: [
              ui.image('abc.png'),
              ui.label({ dataKey: '..submitMessage' }),
              ui.button({ text: 'Submit' }),
            ],
          },
        ],
      }
      Hello = {
        greeting: 'good morning',
        fullName: 'Chris Tran',
        listData,
        components: [
          {
            id: 'container',
            type: 'view',
            children: [
              ui.textField({
                id: 'tf',
                dataKey: 'Hello.greeting',
                placeholder: 'Say your greeting',
              } as any),
              {
                type: 'view',
                id: 'pageParent',
                children: [
                  ui.page({
                    id: 'page123',
                    path: 'Donut',
                    children: [],
                  }),
                ],
              },
            ],
          },
        ],
      }
      pageComponentObject = ui.page({
        type: 'page',
        path: { if: [true, '..thePageName', '..thePageName'] },
        style: { width: '0.5', height: '0.5' },
      })
      viewComponentObject = ui.view({
        children: [pageComponentObject],
      }) as any
    })

    function createRender(
      opts?: Omit<Parameters<typeof _createRender>[0], 'root'> & {
        root?:
          | Record<string, any>
          | ((currentRoot: Record<string, any>) => Record<string, any>)
      },
    ) {
      const currentRoot = { Cereal, Donut, Hello }
      const renderer = _createRender({
        ...opts,
        root: u.isFnc(opts?.root) ? opts?.root(currentRoot) : currentRoot,
      })
      renderer.nui.use({
        getPages: () => u.keys(renderer.getRoot()),
      })
      return renderer
    }

    xit(`should create an NDOM page if it hasn't already been created`, () => {
      //
    })

    xit(`should return the same id as the associated NUIPage`, () => {
      //
    })

    xit(`should return the same page name as the associated NUIPage`, () => {
      //
    })

    it(`should be an iframe and in the DOM`, async () => {
      const { render } = createRender()
      await render()
      await waitFor(() => {
        expect(
          getFirstByElementId('page123') as HTMLIFrameElement,
        ).to.be.instanceOf(HTMLIFrameElement)
      })
    })

    it(`should render the component children to the DOM when received`, async () => {
      const { render } = createRender()
      await render()
      await waitFor(() => {
        const pageElem = getFirstByElementId('page123') as HTMLIFrameElement
        const pageElemBody = pageElem?.contentDocument?.body
        expect(pageElemBody).to.exist
        expect(pageElemBody?.childElementCount).to.be.greaterThan(0)
        expect(getFirstByElementId('donutInput')).to.exist
      })
    })

    it(`should have the same pages in NDOM global as the amount of pages in the NUI page cache`, async () => {
      const { render } = createRender()
      await render()
      await waitFor(() => {
        const pageElem = getFirstByElementId('page123') as HTMLIFrameElement
        const pageElemBody = pageElem?.contentDocument?.body
        expect(pageElemBody?.childElementCount).to.be.greaterThan(0)
      })
      expect(u.keys(ndom.pages)).to.have.lengthOf(cache.page.length)
    })

    it(`should still render an empty iframe if path is an empty string`, async () => {
      const { render, pageObject } = createRender({
        root: (currentRoot) => {
          currentRoot.Hello.components[0].children[1].children[0].path = ''
          return currentRoot
        },
      })
      await render()
      await waitFor(() => {
        const pageElem = findBySelector('page') as HTMLIFrameElement
        expect(pageElem?.contentDocument?.body).to.exist
      })
    })

    it(`should still set the NDOM page to global pages if path is an empty string`, async () => {
      const { render } = createRender({
        root: (currentRoot) => {
          currentRoot.Hello.components[0].children[1].children[0].path = ''
          return currentRoot
        },
      })
      await render()
      await waitFor(() => {
        const pageElem = getFirstByElementId('page123') as HTMLIFrameElement
        const pageElemBody = pageElem?.contentDocument?.body
        expect(pageElemBody?.childElementCount).to.eq(0)
      })
      expect(u.keys(ndom.pages)).to.have.lengthOf(cache.page.length)
    })

    it(
      `should immediately re-render if its page name is set to a different ` +
        `one and PAGE_CHANGED is emitted`,
      async () => {
        const getPageElem = () =>
          document.getElementsByClassName('page')[0] as HTMLIFrameElement
        const getPageElemBody = () =>
          getPageElem().contentDocument?.body as HTMLBodyElement
        const { render } = createRender()
        await render()
        await waitForPageChildren()
        expect(getPageElemBody().children[0].children[0]).to.eq(
          getFirstByElementId('donutInput'),
        )
        const component = cache.component.get('page123').component
        const page = component.get('page') as NUIPage
        page.page = 'Cereal'
        ndom.findPage(page).requesting = 'Cereal'
        component.emit(nuiEvent.component.page.PAGE_CHANGED)
        await waitForPageChildren()
        expect(getPageElemBody())
          .to.have.property('childElementCount')
          .greaterThan(0)
        await waitFor(() => {
          expect(getPageElemBody().children[0] as HTMLElement)
            .to.have.property('tagName')
            .not.to.eq('INPUT')
          expect(getPageElemBody().children[0])
            .to.have.property('children')
            .with.lengthOf(4)
        })
      },
    )

    describe(nc.italic('component cache'), () => {
      let _counter = 0
      let _ids = [] as number[]

      const getPageElem = () =>
        getFirstByElementId('page123') as HTMLIFrameElement

      const getRoot = (currentRoot?: Record<string, any>) => ({
        Tiger: {
          components: [
            {
              type: 'view',
              id: 'tigerView',
              children: [
                ui.scrollView({
                  id: 'tigerScrollView',
                  children: [
                    ui.button({
                      id: 'tigerButton',
                      text: 'Submit',
                    }),
                  ],
                }),
              ],
            },
          ],
        },
        Cereal: {
          components: [
            createWithIdIncrementer({
              id: 'cereal-grandparent',
              type: 'view',
              children: [
                createWithIdIncrementer({
                  type: 'view',
                  children: [
                    createWithIdIncrementer(
                      ui.button({
                        children: [
                          createWithIdIncrementer(
                            ui.scrollView({
                              children: [
                                createWithIdIncrementer(
                                  ui.scrollView({
                                    children: [
                                      createWithIdIncrementer(
                                        ui.textField({
                                          placeholder: 'Enter name',
                                          id: 'cereal-last-child',
                                        } as any),
                                      ),
                                    ],
                                  }),
                                ),
                              ],
                            }),
                          ),
                        ],
                      }),
                    ),
                    createWithIdIncrementer(ui.textField()),
                    createWithIdIncrementer(ui.textView()),
                    createWithIdIncrementer(ui.label('morning')),
                    createWithIdIncrementer(ui.button()),
                    createWithIdIncrementer(ui.image('abc.png')),
                    createWithIdIncrementer(
                      ui.divider({ id: 'cereal-divider' }),
                    ),
                  ],
                }),
              ],
            }),
          ],
        },
        ...currentRoot,
      })

      const createWithIdIncrementer = (obj: ComponentObject) => {
        _ids.push(++_counter)
        return { ...obj, id: _counter } as ComponentObject
      }

      xit(`should return all the component ids that are currently active in the DOM`, async () => {
        const view1Obj = { type: 'view', children: [ui.label()] }
        const view2Obj = {
          type: 'view',
          children: [ui.page({ id: 'page123', path: 'Cereal' })],
        }
        const { render } = createRender({
          components: [view1Obj, view2Obj],
          root: getRoot,
        })

        await render('Hello')

        const { component: pageComponent } = cache.component.get('page123')
        const flattenedComponents = flattenComponents(pageComponent)

        const allIds = flattenedComponents
          .map(({ id }) => id)
          .sort((a, b) => (a < b ? -1 : 0))

        await waitFor(() => {
          const pageElem = getPageElem()
          expect(pageElem).to.exist
          expect(pageElem.contentDocument?.body)
            .to.have.property('children')
            .to.have.lengthOf(1)
        })
      })

      it(`should be in sync with the component cache`, async () => {
        const pageComponentObject = ui.page('Cereal')
        const { ndom, pageObject, render } = createRender({
          pageName: 'Hello',
          root: (c) => ({
            ...c,
            ...getRoot({
              Hello: {
                components: [
                  { id: 'p1', type: 'view', children: [ui.label()] },
                  { id: 'p2', type: 'view', children: [pageComponentObject] },
                ],
              },
            }),
          }),
        })

        await render()

        const view = cache.component.get('p1').component
        const view2 = cache.component.get('p2').component
        const pageComponent = view2.child()
        const nuiPage = pageComponent.get('page') as NUIPage

        await waitForPageChildren()

        const expectedCurrentComponentCount = 16

        expect(cache.component.length).to.eq(expectedCurrentComponentCount)

        let pageChildrenIds = pageComponent.get('ids') as string[]
        let cachedComponentIds = [
          ...Array.from(cache.component.get().values()).map(
            (obj) => obj.component.id,
          ),
        ]
        expect(pageChildrenIds).to.satisfy(
          () => pageChildrenIds.every((id) => cachedComponentIds.includes(id)),
          `All page components (${pageChildrenIds.length}) should be in the component cache`,
        )

        nuiPage.page = 'Tiger'
        ndom.findPage(nuiPage).requesting = 'Tiger'
        pageComponent.emit(nuiEvent.component.page.PAGE_CHANGED)

        await waitFor(() => {
          expect(
            findBySelector('page').contentDocument?.getElementById(
              'tigerButton',
            ),
          ).to.exist
        })

        const oldPageChildrenIds = pageChildrenIds

        pageChildrenIds = pageComponent.get('ids') as string[]
        cachedComponentIds = Array.from(cache.component.get().values()).map(
          (obj) => obj?.component?.id,
        )

        expect(oldPageChildrenIds).to.satisfy(
          () => oldPageChildrenIds.every((id) => !cache.component.get(id)),
          'All components from the previous page should be removed from the cache',
        )

        expect(
          cache.component.get(findBySelector('page').id).component,
        ).to.have.length.greaterThan(0)

        expect(pageChildrenIds).to.satisfy(
          () => pageChildrenIds.every((id) => cache.component.has(id)),
          'All components from the Tiger page should be in the cache',
        )
        const helloPageComponents = Array.from(cache.component.get()).reduce(
          (acc, [id, { component, page }]) => {
            if (page === 'Hello') acc.push(component)
            return acc
          },
          [] as NUIComponent.Instance[],
        )
        expect(helloPageComponents).to.satisfy(
          () => helloPageComponents.every(({ id }) => cache.component.has(id)),
          'All components from the parent (Hello) page should still be in the cache',
        )
        expect(helloPageComponents).to.have.lengthOf(4)
      })

      it(`should not have additional components in the cache that have their page set to the page component's target page after resolving`, async () => {
        const pageComponentObject = ui.page({ id: 'page123', path: 'Cereal' })
        const { render } = createRender({
          pageName: 'Hello',
          root: (c) => ({
            ...c,
            ...getRoot({
              Hello: {
                components: [
                  { id: 'p1', type: 'view', children: [ui.label()] },
                  { id: 'p2', type: 'view', children: [pageComponentObject] },
                ],
              },
            }),
          }),
        })
        await render()
        const pageComponent = cache.component.get('p2').component.child()
        const nuiPage = pageComponent.get('page') as NUIPage
        await waitForPageChildren()
        nuiPage.page = 'Tiger'
        ndom.findPage(nuiPage).requesting = 'Tiger'
        pageComponent.emit(nuiEvent.component.page.PAGE_CHANGED)
        await waitForPageChildren()
        await waitFor(() => {
          expect(getPageComponentChildIds(pageComponent)).to.have.all.members([
            'tigerView',
            'tigerScrollView',
            'tigerButton',
          ])
        })
      })
    })

    xit(`should receive the NUIPage instance on its 'page' prop in the resolve function`, async () => {
      const { render } = createRender()
      const view = await render()
      await waitFor(() => {
        expect(view.child()).to.have.property('type', 'page')
        expect(view.child().get('page')).to.exist
        // expect(isNUIPage(view.child().get('page'))).to.be.true
      })
    })

    xit(`should set its rootNode to the node that is rendering`, () => {
      //
    })

    xit(`should eventually receive the page components`, () => {
      //
    })

    xit(`should not duplicate any children`, async () => {
      const view = await render()
      const pageNode = findByElementId(view.child().id) as HTMLIFrameElement
      await waitFor(() => {
        const childrenList = Array.from(
          pageNode.contentDocument?.body.children as HTMLCollection,
        )
        expect(childrenList).to.have.length.greaterThan(0)
        expect(childrenList).to.have.length(1)
      })
    })

    xit(`should update the root object which should also reflect in the root page`, async () => {
      const { getRoot, render: renderProp, nui } = await render((opts) => opts)
      nui.use({
        emit: {
          onChange: async () =>
            void (donutPageObject.formData.password = 'abc123'),
        },
        getPages: () => ['SignIn', 'Donut', 'Hello'],
      })
      const view = await renderProp()
      expect(getRoot().Donut.formData).to.have.property('password', 'fruits')
      const page = view.child()

      await waitFor(() => {
        const pageNode = findByElementId(page.id || '') as HTMLIFrameElement
        const pageChildren = pageNode?.contentDocument?.body
        expect(pageNode).to.exist
        expect(pageChildren).to.exist
        // const input = pageChildrenNodes.item(0) as HTMLInputElement
        // expect(input).to.be.instanceOf(HTMLInputElement)
        // input.dispatchEvent(new Event('change'))
        // expect(donutPageObject.formData).to.have.property('password', 'abc123')
      })
      // await waitFor(() => {
      //   const input = pageChildrenNodes.item(0) as HTMLInputElement
      //   expect(input).to.be.instanceOf(HTMLInputElement)
      //   input.dispatchEvent(new Event('change'))
      //   expect(donutPageObject.formData).to.have.property('password', 'abc123')
      // })
    })
  })

  describe(nc.italic(`textField`), () => {
    it(`should initialize value with data-value on load`, async () => {
      const { render } = _createRender({
        root: {
          Hello: {
            formData: { password: 'pw123' },
            components: [ui.textField('formData.password')],
          },
        },
      })
      const textField = await render()
      const input = getFirstByElementId(textField)
      expect(input.dataset).to.have.property('value', 'pw123')
      expect(input).to.have.property('value', 'pw123')
    })
  })
})
