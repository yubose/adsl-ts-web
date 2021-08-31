import { expect } from 'chai'
import { prettyDOM, waitFor } from '@testing-library/dom'
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
  ui,
  ndom,
  waitForPageChildren,
} from '../test-utils'
import type NDOMPage from '../Page'
import { findByElementId, findBySelector, getFirstByElementId } from '../utils'
import { cache } from '../nui'
import * as i from '../utils/internal'
import ComponentPage from '../factory/componentFactory/ComponentPage'

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

    xit(`should set tagName as iframe by default`, () => {
      //
    })

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
      const { ndom, render } = _createRender({
        pageName: 'Hello',
        root: {
          Donut: {
            components: [ui.view({ children: [ui.button(), ui.label()] })],
          },
          Hello: { components: [ui.view({ children: [ui.page('Donut')] })] },
        },
      })
      ndom.use({ getPages: () => ['Donut', 'Hello'] })
      const view = await render()
      const pageComponent = view.child()
      await waitFor(() => {
        const componentPage = ndom.findPage(pageComponent)
        expect(componentPage).to.exist
        expect(componentPage?.body).to.exist
        expect(componentPage.body)
          .to.have.property('children')
          .to.have.length.greaterThan(0)
      })
      expect(u.keys(ndom.pages)).to.have.lengthOf(cache.page.length)
    })

    it(`should still render an empty iframe if path is an empty string`, async () => {
      const { render } = createRender({
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
        const pageElem = findBySelector('page') as HTMLIFrameElement
        const pageElemBody = pageElem?.contentDocument?.body
        expect(pageElemBody?.childElementCount).to.eq(0)
      })
      await waitFor(() =>
        expect(ndom.global.pageIds).to.have.lengthOf(cache.page.length),
      )
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
        const ndomPage = ndom.findPage(component.get('page') as NUIPage)
        ndomPage && (ndomPage.page = 'Tiger')
        ndomPage && (ndomPage.requesting = 'Tiger')
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

      describe(`syncing with component cache`, () => {
        function getCreateRenderOptions({
          targetPage = 'Cereal',
          ...opts
        }: Record<string, any> = {}) {
          return {
            pageName: 'Hello',
            root: (c) => ({
              ...c,
              ...getRoot({
                Hello: {
                  components: [
                    { id: 'p1', type: 'view', children: [ui.label()] },
                    { id: 'p2', type: 'view', children: [ui.page(targetPage)] },
                  ],
                },
              }),
            }),
            ...opts,
          }
        }

        async function changeToTigerPage(
          ndomPage: NDOMPage,
          component: NUIComponent.Instance,
        ) {
          if (!ndomPage) return
          ndomPage.page = 'Tiger'
          ndomPage.requesting = 'Tiger'
          return component.emit(nuiEvent.component.page.PAGE_CHANGED)
        }

        it(`should add all the page descendant children to the component cache`, async () => {
          const { render } = createRender(getCreateRenderOptions())
          await render()
          const view2 = cache.component.get('p2').component
          const pageComponent = view2.child()
          await waitForPageChildren()
          const expectedCurrentComponentCount = 16

          await waitFor(() => {
            expect(
              getFirstByElementId(pageComponent).contentDocument.body.children,
            )
              .to.have.property('length')
              .greaterThan(0)
          })

          expect(cache.component.length).to.eq(expectedCurrentComponentCount)
          const pageChildrenIds = i._getDescendantIds(pageComponent)
          const cachedComponentIds = [...cache.component.get().values()].map(
            (obj) => obj.component.id,
          )
          expect(pageChildrenIds).to.satisfy(() =>
            pageChildrenIds.every((id) => cachedComponentIds.includes(id)),
          )
        })

        xit(`should remove all the previous descendant page children from the component cache`, async () => {
          const { ndom, render } = createRender(getCreateRenderOptions())
          await render()
          const pageComponent = cache.component.get('p2').component.child()
          await waitForPageChildren()
          const oldPageChildrenIds = i._getDescendantIds(pageComponent)
          const componentPage = ndom.findPage(
            pageComponent.get('page') as NUIPage,
          ) as ComponentPage
          oldPageChildrenIds.forEach((id) => {
            expect(cache.component.get(id)).to.exist
          })

          //           console.info(
          //             `
          // oldIds: ${oldPageChildrenIds}
          // newIds: ${i._getDescendantIds(pageComponent)}
          //             `,
          //           )
          await changeToTigerPage(componentPage, pageComponent)
          await waitForPageChildren()
          //           console.info(`PAGE COMPONENT`, pageComponent)
          //           console.info(
          //             `
          // oldIds: ${oldPageChildrenIds}
          // newIds: ${i._getDescendantIds(pageComponent)}
          //             `,
          //           )
          await waitFor(() => {
            oldPageChildrenIds.forEach((id) => {
              expect(cache.component.get(id)).to.not.exist
            })
          })
        })

        it(`should not have additional components in the cache that have their page set to the page component's target page after resolving`, async () => {
          let { render } = createRender(
            getCreateRenderOptions({ targetPage: 'Tiger' }),
          )
          await render()
          await waitForPageChildren()
          let pageComponent = cache.component.get('p2').component.child()
          let ndomPage = ndom.findPage(pageComponent.get('page') as NUIPage)
          await changeToTigerPage(ndomPage, pageComponent)
          await waitForPageChildren()
          pageComponent = cache.component.get('p2').component.child()

          await waitFor(() => {
            const ids = i._getDescendantIds(pageComponent)
            console.info(ids)
            expect(ids).to.have.lengthOf(3)
            expect(ids).to.have.all.members([
              'tigerView',
              'tigerScrollView',
              'tigerButton',
            ])
          })
        })
      })
    })

    xit(`should set its rootNode to the node that is rendering`, () => {
      //
    })

    xit(`should eventually receive the page components`, () => {
      //
    })

    it(`should render normally as with non page components`, async () => {
      const listObject = [
        { greeting: 'good morning', btnText: 'Click' },
        { greeting: 'good bye', btnText: 'Dont click' },
      ]
      const { render } = createRender({
        root: (currRoot) => ({
          ...currRoot,
          Donut: {
            components: [
              ui.view({
                id: 'container',
                children: [
                  ui.divider(),
                  ui.list({
                    iteratorVar: 'itemObject',
                    listObject,
                    children: [
                      ui.listItem({
                        children: [
                          ui.textField('itemObject.greeting'),
                          ui.label({ dataKey: 'itemObject.btnText' }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          },
        }),
        components: [ui.view({ children: [ui.page('Donut')] })],
      })
      const viewComponent = await render()
      const pageComponent = viewComponent.child()
      let pageEl = getFirstByElementId(pageComponent) as HTMLIFrameElement
      let pageBodyEl: HTMLBodyElement

      expect(pageEl).to.exist
      expect(pageEl).to.be.instanceOf(HTMLIFrameElement)

      await waitFor(() => {
        expect((pageBodyEl = pageEl.contentDocument.body as HTMLBodyElement))
          .to.have.property('children')
          .with.lengthOf(1)
      })

      const containerEl = pageBodyEl.firstChild as HTMLDivElement
      expect(containerEl).to.have.property('children').with.lengthOf(2)
      expect(containerEl.firstChild).to.have.property('tagName', 'HR')
      expect(containerEl.childNodes.item(1)).to.have.property('tagName', 'UL')
      const listEl = containerEl.querySelector('ul') as HTMLUListElement
      expect(listEl).to.have.property('children').lengthOf(listObject.length)
      listObject.forEach((obj, index) => {
        const listItemEl = listEl.childNodes.item(index) as HTMLLIElement
        expect(listItemEl).to.have.property('children').lengthOf(2)
        expect(listItemEl.firstChild).to.have.property('tagName', 'INPUT')
        expect(listItemEl.lastChild).to.have.property('tagName', 'DIV')
        const inputEl = listItemEl.querySelector('input') as HTMLInputElement
        const labelEl = listItemEl.querySelector('div') as HTMLDivElement
        expect(inputEl).to.have.property('value', obj.greeting)
        expect(labelEl).to.have.property('innerHTML', obj.btnText)
      })
    })

    it(`should not duplicate any children`, async () => {
      const { getRoot, page, pageObject, render } = createRender({
        components: [ui.view({ children: [ui.page('Donut')] })],
      })
      const view = await render()
      const pageComponent = view.child()
      await waitFor(() => {
        const pageNode = getFirstByElementId(pageComponent) as HTMLIFrameElement
        const pageBody = pageNode?.contentDocument?.body
        expect(pageBody).to.exist
        expect(pageBody.childElementCount).to.eq(
          getRoot().Donut.components.length,
        )
        expect(pageBody)
          .to.have.property('childNodes')
          .to.have.length(getRoot().Donut.components.length)
      })
    })

    it.only(`should update the root object which should also reflect in the root page`, async () => {
      const { getRoot, render: renderProp, nui } = createRender()
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

    describe(`when rendering through absolute/remote urls (http*)`, () => {
      xit(`should create an NDOM page using the PageComponent`, () => {
        //
      })

      xit(`should create a new NDOM PageComponent if not created yet`, () => {
        //
      })

      xit(`should reuse existing NDOM PageComponent if the URL is the same as one found in the global map`, () => {
        //
      })

      xit(`should not reuse but create a new NDOM PageComponent if rendering additional components with the same URL`, () => {
        //
      })

      xit(`should listen for postMessage messages`, () => {
        //
      })

      xit(`should be able to receive messages from inside the iframe`, () => {
        //
      })

      xit(`should be able to send messages to the parent window from within the iframe`, () => {
        //
      })

      describe(`when using postMessage emit`, () => {
        xit(`should use the object received from postMessage as the data object`, () => {
          //
        })

        xit(`should invoke the postMessage action chain when receiving a message inside of the remote page`, () => {
          //
        })
      })

      xit(`should listen on the onload event if it is not loaded yet`, () => {
        //
      })

      xit(`should immediately fire custom onload events if the element is already loaded into the DOM`, () => {
        //
      })
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
