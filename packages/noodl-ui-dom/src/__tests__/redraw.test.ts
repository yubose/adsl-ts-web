import sinon from 'sinon'
import * as mock from 'noodl-ui-test-utils'
import * as u from '@jsmanifest/utils'
import * as nc from 'noodl-common'
import { expect } from 'chai'
import { ComponentObject, EmitObjectFold, PageObject } from 'noodl-types'
import { waitFor } from '@testing-library/dom'
import {
  Component,
  createComponent,
  flatten,
  NUIActionObjectInput,
} from 'noodl-ui'
import { createRender, getAllElementCount, ndom, ui } from '../test-utils'
import {
  findBySelector,
  findFirstBySelector,
  getFirstByDataKey,
  getFirstByElementId,
} from '../utils'
import { cache, nui } from '../nui'
import { getFirstByViewTag } from '../../dist'

let view: Component

describe(nc.coolGold(`redraw`), () => {
  describe(nc.italic(`events`), () => {
    let id = 'hello'
    let componentObject: ComponentObject | undefined
    let currentCount = 0
    let emitObject: EmitObjectFold
    let increment = () => currentCount++
    let onClick: NUIActionObjectInput[] = []
    let pageName = 'Counter'
    let pageObject = {} as PageObject

    beforeEach(() => {
      emitObject = mock.getFoldedEmitObject({
        emit: { dataKey: { var1: 'hey' }, actions: [] },
      })
      onClick = [emitObject]
      componentObject = mock.getLabelComponent({
        id,
        text: String(currentCount),
        onClick: onClick as any,
      })
      pageObject = { components: [componentObject] }
    })

    it(`should still be executing the same action chains normally`, async () => {
      const { ndom, render } = createRender({
        pageName,
        pageObject,
        components: pageObject.components,
      })
      ndom.use({
        emit: {
          onClick: async () => {
            const node = getFirstByElementId(id)
            node.innerHTML = String(increment())
          },
        },
      })
      let component = await render()
      let node = getFirstByElementId(id)
      // TODO - fix this so that it works with only 1 click
      node.click()
      node.click()
      await waitFor(() => expect(node.textContent).to.eq('1'))
      let [_, newComp] = ndom.redraw(node, component)
      node = _ as any
      node?.click()
      await waitFor(() => expect(node?.textContent).to.eq('2'))
      node?.click()
      node?.click()
      node?.click()
      let pair = ndom.redraw(node, newComp)
      node = pair[0]
      newComp = pair[1]
      await waitFor(() => expect(node?.textContent).to.eq('5'))
    })
  })

  it(`should remove the redrawing components from the component cache`, async () => {
    const { ndom, render } = createRender({
      components: ui.list({ listObject: mock.getGenderListObject() }),
    })
    const component = await render()
    const node = getFirstByElementId(component)
    const idsToBeRemoved = flatten(component).map((c) => c.id)
    expect(idsToBeRemoved).to.have.length.greaterThan(0)
    expect(ndom.cache.component).to.have.lengthOf(idsToBeRemoved.length)
    component.children.forEach(
      (child) => expect(ndom.cache.component.has(child)).to.be.true,
    )
    ndom.redraw(node, component)
    idsToBeRemoved.forEach(
      (id) => expect(ndom.cache.component.has(id)).to.be.false,
    )
  })

  it(`the amount of descendants should remain the same in the components`, async () => {
    const { ndom, render } = createRender({
      components: [
        ui.list({ listObject: mock.getGenderListObject() }),
        mock.getLabelComponent(),
      ],
    })
    const list = await render()
    const node = getFirstByElementId(list)
    const idsToBeRemoved = flatten(list).map((c) => c.id)
    const idsToBeRemovedLengthBefore = idsToBeRemoved.length
    const [_, newComp] = ndom.redraw(node, list)
    expect(flatten(newComp).map((c) => c.id)).to.have.length(
      idsToBeRemovedLengthBefore,
    )
  })

  it(`the DOM should structurally remain identical`, async () => {
    const iteratorVar = 'itemObject'
    const listObject = mock.getGenderListObject()
    const { ndom, render } = createRender({
      pageObject: {
        formData: { password: 'mypw' },
        components: [
          ui.view({
            viewTag: 'container',
            children: [
              ui.list({
                iteratorVar,
                listObject,
                children: [
                  ui.listItem({
                    [iteratorVar]: '',
                    children: [
                      ui.label({ dataKey: `${iteratorVar}.key` }),
                      ui.textField(`${iteratorVar}.value`),
                    ],
                  }),
                ],
              }),
              ui.label(),
              ui.view({ children: [ui.textField('formData.password')] }),
            ],
          }),
        ],
      },
    })
    const container = await render()
    const getContainerElem = () =>
      findBySelector('[data-viewtag=container]') as HTMLElement

    expect(getAllElementCount(`[data-viewtag=container]`)).to.eq(1)
    expect(getAllElementCount('ul')).to.eq(1)
    expect(getAllElementCount('li')).to.eq(listObject.length)
    expect(getAllElementCount(`[data-key="${iteratorVar}.key"]`)).to.eq(3)
    expect(getAllElementCount(`[data-key="${iteratorVar}.value"]`)).to.eq(3)
    expect(getAllElementCount(`[data-key="formData.password"]`)).to.eq(1)
    ndom.redraw(getContainerElem(), container)
    ndom.redraw(getContainerElem(), container)
    ndom.redraw(getContainerElem(), container)
    ndom.redraw(getContainerElem(), container)
    ndom.redraw(getContainerElem(), container)
    expect(getAllElementCount(`[data-viewtag=container]`)).to.eq(1)
    expect(getAllElementCount('ul')).to.eq(1)
    expect(getAllElementCount('li')).to.eq(listObject.length)
    expect(getAllElementCount(`[data-key="${iteratorVar}.key"]`)).to.eq(3)
    expect(getAllElementCount(`[data-key="${iteratorVar}.value"]`)).to.eq(3)
    expect(getAllElementCount(`[data-key="formData.password"]`)).to.eq(1)
  })

  it(
    `the size of the component cache should always remain the same no ` +
      `matter how many times redraw is called`,
    async () => {
      const iteratorVar = 'itemObject'
      const listObject = mock.getGenderListObject()
      let { ndom, render } = createRender([
        ui.list({
          iteratorVar,
          listObject,
          children: [ui.listItem({ [iteratorVar]: '' })],
        }),
        mock.getLabelComponent(),
      ])
      let list = await render()
      let componentCacheLengthBefore = ndom.cache.component.length
      let listElem = getFirstByElementId(list)

      await waitFor(() => {
        expect(listElem.querySelectorAll('li')).to.have.lengthOf(3)
      })
      let pair = ndom.redraw(getFirstByElementId(list), list)
      expect(list.blueprint.listObject).to.have.lengthOf(3)
      pair = ndom.redraw(pair[0], pair[1])
      pair = ndom.redraw(pair[0], pair[1])
      pair = ndom.redraw(pair[0], pair[1])
      pair = ndom.redraw(pair[0], pair[1])
      expect(ndom.cache.component.length).to.eq(componentCacheLengthBefore)
    },
  )

  it(`should still have the same amount of children as the previous listObject if the data remained the same`, async () => {
    const iteratorVar = 'itemObject'
    const listObject = mock.getGenderListObject()
    let { ndom, render } = createRender([
      ui.list({
        iteratorVar,
        listObject,
        children: [
          ui.listItem({
            [iteratorVar]: '',
            children: [ui.textField(), ui.divider()],
          }),
        ],
      }),
      ui.label(),
    ])
    let list = await render()
    expect(findBySelector('li')).to.have.lengthOf(3)
    ndom.redraw(getFirstByElementId(list), list)
    ndom.redraw(getFirstByElementId(list), list)
    ndom.redraw(getFirstByElementId(list), list)
    expect(u.array(findBySelector('li'))).to.have.lengthOf(3)
    expect(u.array(findBySelector('input'))).to.have.lengthOf(3)
    expect(u.array(findBySelector('hr'))).to.have.lengthOf(3)
  })

  describe(nc.italic(`select components`), () => {
    it('should render more option children if the data has more items', async () => {
      let options = ['00:00', '00:10']
      let otherOptions = ['00:20', '00:30']
      let { render } = createRender(mock.getSelectComponent({ options }))
      let component = await render()
      let node = getFirstByElementId(component) as HTMLSelectElement
      let optionsNodes = Array.from(node.options)
      expect(node.options).to.have.lengthOf(2)
      optionsNodes.forEach((optionNode, index) =>
        expect(optionNode.value).to.eq(options[index]),
      )
      options.push(...otherOptions)
      let result = ndom.redraw(node, component)
      node = result[0] as HTMLSelectElement
      component = result[1]
      expect(node.options).to.have.lengthOf(4)
      for (let index = 0; index < node.options.length; index++) {
        expect(node.options[index].value).to.eq(options[index])
      }
    })
  })

  it('should set the original parent as the parent of the new redrawee component', async () => {
    const view = createComponent('view')
    const list = await createRender({
      components: [ui.list({ listObject: mock.getGenderListObject() })],
    }).render()
    view.createChild(list)
    list.setParent(view)
    ndom.draw(view)
    const listItem = list.child()
    const liNode = document.getElementById(listItem?.id || '')
    const [newLiNode, newListItem] = ndom.redraw(liNode, listItem)
    expect(newListItem?.parent).to.eq(list)
  })

  it('should set the new component as a child on the original parent', async () => {
    const view = createComponent('view')
    const list = await createRender({
      components: [
        ui.list({
          listObject: mock.getGenderListObject(),
          children: [ui.listItem({ children: [ui.label()] })],
        }),
      ],
    }).render()
    view.createChild(list)
    list.setParent(view)
    ndom.draw(view)
    const listItem = list.child()
    const [empty, newListItem] = ndom.redraw(null, listItem)
    ndom.redraw(null, newListItem)
    expect(list.children.includes(newListItem)).to.be.true
  })

  it('the redrawing component + node should hold the same ID', async () => {
    ndom.draw(view)
    const list = await createRender({
      components: [ui.list({ listObject: mock.getGenderListObject() })],
    }).render()
    const listItem = list.child()
    const liNode = document.getElementById(listItem?.id || '')
    const [newLiNode, newListItem] = ndom.redraw(liNode, listItem)
    expect(newLiNode).to.have.property('id').that.is.eq(newListItem.id)
  })

  it('should attach to the original parentNode as the new childNode', async () => {
    const view = createComponent('view')
    const list = await createRender({
      components: [ui.list({ listObject: mock.getGenderListObject() })],
    }).render()
    view.createChild(list)
    list.setParent(view)
    ndom.draw(view)
    const listItem = list.child()
    const liNode = document.getElementById(listItem?.id || '')
    const ulNode = liNode?.parentNode as HTMLUListElement
    expect(ulNode.contains(liNode)).to.be.true
    const [newNode] = ndom.redraw(liNode, listItem)
    expect(ulNode.contains(liNode)).to.be.false
    expect(ulNode.children).to.have.length.greaterThan(0)
    expect(newNode?.parentNode).to.eq(ulNode)
  })

  describe('when using path emits after redrawing', () => {
    it('should still be able to emit and update the DOM', async () => {
      let imgPath = 'selectOn.png'
      const pathSpy = sinon.spy(async () => [
        imgPath === 'selectOn.png' ? 'selectOff.png' : 'selectOn.png',
      ])
      const onClickSpy = sinon.spy(async () => {
        imgPath = imgPath === 'selectOn.png' ? 'selectOff.png' : 'selectOn.png'
        return ['']
      })
      const { ndom, render } = createRender({
        type: 'view',
        children: [
          ui.image({
            id: 'img123',
            path: ui.emitObject(),
            onClick: [ui.emitObject()],
          }),
        ],
      })
      ndom.use({ emit: { onClick: onClickSpy, path: pathSpy } })
      const view = await render()
      const image = view.child()
      getFirstByElementId('img123').click()
      await waitFor(() => {
        expect(onClickSpy).to.be.calledOnce
        expect(pathSpy).to.be.calledOnce
        expect(onClickSpy).to.be.calledOnce
      })
      ndom.redraw(getFirstByElementId('img123'), image)
      getFirstByElementId('img123').click()
      await waitFor(() => {
        const newImg = getFirstByElementId('img123') as HTMLImageElement
        const expectedSrc = nui.getAssetsUrl() + imgPath
        expect(newImg.src).to.eq(expectedSrc)
      })
    })
  })

  describe('when user types something on a redrawed input node that had an onChange emit', () => {
    it('should still be emitting and updating the DOM', async () => {
      const mockOnChangeEmit = async (action, { component }) => {
        const node = getFirstByElementId(component)
        node.setAttribute('placeholder', component.get('data-value'))
      }
      const { ndom, render } = createRender({
        pageName: 'Abc',
        pageObject: {
          components: [
            { type: 'view', children: [ui.textField('formData.password')] },
          ],
          formData: { password: 'mypassword' },
        },
      })
      ndom.use({ emit: { onChange: mockOnChangeEmit } })
      const view = await render()
      const viewElem = getFirstByElementId(view)
      let input = getFirstByDataKey('formData.password') as HTMLInputElement
      expect(input.dataset.value).to.eq('mypassword')
      expect(input.value).to.eq('mypassword')
      ndom.redraw(viewElem, view)
      input = getFirstByDataKey('formData.password') as HTMLInputElement
      expect(input.dataset.value).to.eq('mypassword')
      expect(input.value).to.eq('mypassword')
      input.dataset.value = ''
      input.value = ''
      expect(input.dataset.value).to.eq('')
      expect(input.value).to.eq('')
      input.select()
      input.value = 'hello'
      input.dispatchEvent(new Event('change'))
      expect(input.dataset.value).to.eq('hello')
      expect(input.value).to.eq('hello')
    })
  })

  it('should deeply resolve the entire noodl-ui component tree down', async () => {
    const iteratorVar = 'cookie'
    const listObject = [
      { fruit: 'apple', color: 'red', path: 'flower.png' },
      { fruit: 'orange', color: 'blue', path: 'wire.png' },
    ]

    const { getAssetsUrl, ndom, pageObject, render } = createRender({
      root: {
        Hello: {
          formData: { password: 'mypassword', outerImagePath: 'abc.png' },
          components: [
            ui.view({
              viewTag: 'containerTag',
              children: [
                ui.list({
                  viewTag: 'listTag',
                  listObject,
                  iteratorVar,
                  children: [
                    ui.listItem({
                      [iteratorVar]: '',
                      viewTag: 'listItemTag',
                      onClick: [ui.emitObject()],
                      children: [
                        ui.textField(`${iteratorVar}.fruit`),
                        mock.getLabelComponent({
                          dataKey: `${iteratorVar}.color`,
                        }),
                        ui.image({
                          viewTag: 'listItemImageTag',
                          path: mock.getFoldedEmitObject({
                            dataKey: `${iteratorVar}.path`,
                          }),
                        }),
                      ],
                    }),
                  ],
                }),
                ui.image({ id: 'abcId', path: '..formData.outerImagePath' }),
                ui.textField('formData.email'),
                ui.view({
                  viewTag: 'viewChildTag',
                  children: [
                    ui.view({
                      children: [
                        ui.button({
                          viewTag: 'submitTag',
                          text: 'Submit',
                          onClick: [ui.emitObject()],
                        }),
                        ui.button({
                          viewTag: 'redrawTag',
                          text: 'Redraw',
                          onClick: [
                            mock.getBuiltInAction({
                              funcName: 'redraw',
                              viewTag: 'containerTag',
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        },
      },
    })

    ndom.use({
      builtIn: {
        redraw: async (action, opts) => {
          const viewTag = action.original.viewTag
          const node = getFirstByViewTag(viewTag)
          const component = cache.component.get(node?.id).component
          pageObject.formData.outerImagePath = 'brown.png'
          ndom.redraw(node, component)
        },
      },
      emit: {
        onClick: async (action, opts) => {
          const orig = opts.component?.blueprint as ComponentObject
          const viewTag = orig.viewTag as string
          const pageObject = opts.getRoot().Hello as PageObject
          if (viewTag === 'listItemTag') {
            const index = opts.context?.index as number
            const dataObject = listObject[index]
            dataObject.color = index + dataObject.color
            dataObject.fruit = index + dataObject.fruit
            dataObject.path = index + dataObject.path
          } else if (viewTag === 'submitTag') {
            pageObject.formData.email = 'aitmed@gmail.com'
            pageObject.formData.password = 'updatedPassword'
          }
        },
        path: async (action, opts) => {
          const orig = opts.component?.blueprint as ComponentObject
          const viewTag = orig.viewTag as string
          if (viewTag === 'listItemImageTag') {
            return [listObject[opts.context?.index].path]
          }
        },
      },
    })

    let view = await render()
    let list = view.child()

    let initialState = {
      container: {
        childCount: view.length,
      },
      list: {
        listObject,
        childCount: list.length,
      },
      listItem1: {
        textField: { 'data-value': listObject[0].fruit },
        label: { 'data-value': listObject[0].color },
        image: { 'data-src': `${getAssetsUrl()}flower.png` },
      },
      listItem2: {
        textField: { 'data-value': listObject[1].fruit },
        label: { 'data-value': listObject[1].color },
        image: { 'data-src': `${getAssetsUrl()}wire.png` },
      },
      logoImage: {
        'data-src': `${getAssetsUrl()}logo.png`,
      },
      textField: {
        'data-value': 'mypassword',
      },
      submitButton: {
        text: 'Submit',
      },
    }

    let containerElem = getFirstByElementId(view.id) as HTMLDivElement
    let listItemElems = findBySelector('li') as HTMLLIElement[]
    let [liElem1] = listItemElems
    let redrawButtonElem = getFirstByViewTag('redrawTag')
    let containerImageElem = getFirstByElementId('abcId')

    const getListItemDataElems = (liElem: HTMLLIElement) => ({
      textField: liElem.querySelector('input'),
      label: liElem.querySelector(`[data-name="color"]`),
      image: liElem.querySelector('img'),
    })

    expect(containerElem)
      .to.have.property('children')
      .with.lengthOf(initialState.container.childCount)
    expect(listItemElems).to.not.be.empty
    expect(listItemElems).to.have.lengthOf(listObject.length)
    expect(containerImageElem).to.exist

    await waitFor(() => {
      expect(containerImageElem).to.have.property(
        'src',
        getAssetsUrl() + 'abc.png',
      )
      for (let index = 0; index < 2; index++) {
        const children = getListItemDataElems(
          (findBySelector('li') as HTMLLIElement[])[index],
        )
        expect(children.textField).to.have.property(
          'value',
          listObject[index].fruit,
        )
        expect(children.label).to.have.property(
          'textContent',
          listObject[index].color,
        )
        expect(children.image).to.have.property(
          'src',
          getAssetsUrl() + listObject?.[index].path,
        )
      }
    })

    liElem1.click()
    redrawButtonElem.click()

    expect(containerElem)
      .to.have.property('children')
      .with.lengthOf(initialState.container.childCount)
    expect(listItemElems).to.not.be.empty
    expect(listItemElems).to.have.lengthOf(listObject.length)

    await waitFor(() => {
      expect(getFirstByElementId('abcId')).to.have.property(
        'src',
        getAssetsUrl() + 'brown.png',
      )
      for (let index = 0; index < 2; index++) {
        const children = getListItemDataElems(
          (findBySelector('li') as HTMLLIElement[])[index],
        )
        expect(children.textField).to.have.property(
          'value',
          listObject[index].fruit,
        )
        expect(children.label).to.have.property(
          'textContent',
          listObject[index].color,
        )
        expect(children.image).to.have.property(
          'src',
          getAssetsUrl() + listObject[index].path,
        )
      }
    })
  })

  it('should structurally remain the same in the dom', async () => {
    const pathSpy = sinon.spy(async () => 'food.png')
    const onClickSpy = sinon.spy(async () => [''])
    const iteratorVar = 'hello'
    const listObject = [
      { fruit: 'apple', color: 'red' },
      { fruit: 'orange', color: 'blue' },
    ]
    const pageObject = {
      formData: { password: 'mypassword' },
      components: [
        ui.view({
          children: [
            ui.list({
              listObject,
              children: [
                ui.listItem({
                  children: [
                    ui.textField({ dataKey: 'formData.password' }),
                    mock.getLabelComponent({ dataKey: `${iteratorVar}.fruit` }),
                    ui.image({
                      path: ui.emitObject(),
                      onClick: [ui.emitObject()],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    } as PageObject

    const { ndom, render } = createRender({ root: { Hello: pageObject } })
    ndom.use({ emit: { path: pathSpy as any, onClick: onClickSpy } })
    await render()

    expect(findBySelector('ul')).to.be.instanceOf(HTMLUListElement)
    expect(findBySelector('li')).to.have.lengthOf(2)
    expect(findBySelector('img')).to.have.lengthOf(2)
    expect(findBySelector('input')).to.have.lengthOf(2)
    const componentId = findFirstBySelector('li').id
    await waitFor(() => {
      expect(findFirstBySelector('input').dataset.value).to.eq('mypassword')
    })
    ndom.redraw(
      findFirstBySelector('li'),
      ndom.cache.component.get(componentId).component,
    )
    expect(u.array(findBySelector('ul'))).to.have.lengthOf(1)
    await waitFor(() => {
      expect(u.array(findBySelector('li'))).to.have.lengthOf(2)
    })
    expect(u.array(findBySelector('img'))).to.have.lengthOf(2)
    expect(u.array(findBySelector('input'))).to.have.lengthOf(2)
    expect(findFirstBySelector('input').dataset).to.have.property(
      'value',
      'mypassword',
    )
  })
})
