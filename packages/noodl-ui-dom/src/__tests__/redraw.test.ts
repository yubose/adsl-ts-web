import sinon from 'sinon'
import * as mock from 'noodl-ui-test-utils'
import * as u from '@jsmanifest/utils'
import { coolGold, italic, magenta } from 'noodl-common'
import { ActionChain } from 'noodl-action-chain'
import { expect } from 'chai'
import { ComponentObject, EmitObjectFold, PageObject } from 'noodl-types'
import { prettyDOM, screen, waitFor } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import {
  Component,
  createComponent,
  findChild,
  flatten,
  NUIComponent,
  NUIActionObjectInput,
} from 'noodl-ui'
import NOODLDOM from '../noodl-ui-dom'
import { assetsUrl, createRender, ndom, toDOM } from '../test-utils'
import { findBySelector, getFirstByElementId } from '../utils'

let view: Component
let listGender: NUIComponent.Instance

describe(coolGold(`redraw`), () => {
  describe(italic(`events`), () => {
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
      const component = await render()
      const node = getFirstByElementId(id)
      // TODO - fix this so that it works with only 1 click
      node.click()
      node.click()
      await waitFor(() => expect(node.textContent).to.eq('1'))
      let [newNode, newComp] = ndom.redraw(node, component)
      newNode?.click()
      await waitFor(() => expect(newNode?.textContent).to.eq('2'))
      newNode?.click()
      newNode?.click()
      newNode?.click()
      let pair = ndom.redraw(newNode, newComp)
      newNode = pair[0]
      newComp = pair[1]
      await waitFor(() => expect(newNode?.textContent).to.eq('5'))
    })
  })

  it(`should remove the redrawing components from the component cache`, async () => {
    const { ndom, render } = createRender({
      components: mock.getListComponent({
        listObject: mock.getGenderListObject(),
      }),
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
    console.log(ndom.cache.component.length)
    idsToBeRemoved.forEach(
      (id) => expect(ndom.cache.component.has(id)).to.be.false,
    )
  })

  it(`the amount of descendants should remain the same`, async () => {
    const { ndom, render } = createRender({
      components: [
        mock.getListComponent({ listObject: mock.getGenderListObject() }),
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

  it(
    `the size of the component cache should always remain the same no ` +
      `matter how many times redraw is called`,
    async () => {
      const { ndom, render } = createRender({
        components: [
          mock.getListComponent({
            listObject: mock.getGenderListObject(),
          }),
          mock.getLabelComponent(),
        ],
      })
      const list = await render()
      let componentCacheLengthBefore = ndom.cache.component.length
      let pair = ndom.redraw(getFirstByElementId(list), list)
      pair = ndom.redraw(pair[0], pair[1])
      pair = ndom.redraw(pair[0], pair[1])
      pair = ndom.redraw(pair[0], pair[1])
      pair = ndom.redraw(pair[0], pair[1])
      expect(componentCacheLengthBefore).to.eq(ndom.cache.component.length)
    },
  )

  describe(italic(`select components`), () => {
    it('should render more option children if the data has more items', async () => {
      let options = ['00:00', '00:10']
      let otherOptions = ['00:20', '00:30']
      let { render } = createRender({
        components: mock.getSelectComponent({ options }),
      })
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

    xit('should re-attach the onchange handler', async () => {
      const spy = sinon.spy()
      const options = ['00:00', '00:10', '00:20'] as string[]
      NOODLDOM._nui.use({ emit: { onChange: spy } })
      const { render } = createRender({
        components: mock.getSelectComponent({
          options,
          onChange: [mock.getFoldedEmitObject()],
        }),
      })
      const component = await render()
      const node = getFirstByElementId(component)
      node.dispatchEvent(new Event('change'))
      expect(node).to.exist
      expect(component).to.exist
      await waitFor(() => expect(spy).to.have.been.called)
    })
  })

  it('should remove the parent reference', async () => {
    const view = await createRender({
      components: [
        mock.getViewComponent({ children: [mock.getListComponent()] }),
      ],
    }).render()
    const list = view.child()
    expect(list.parent).to.eq(view)
    const node = ndom.draw(list)
    ndom.redraw(node, list)
    expect(list.parent?.child()).not.to.eq(list)
  })

  xit("should remove the component from the parent's children", () => {
    const view = createComponent('view')
    const list = getListGender()
    view.createChild(list)
    list.setParent(view)
    expect(view.hasChild(list)).to.be.true
    const node = ndom.draw(list)
    ndom.redraw(node, list)
    expect(view.hasChild(list)).to.be.false
  })

  xit('should recursively remove child references', () => {
    const node = ndom.draw(listGender)
    const listItem = listGender.child()
    const [label, image] = listItem?.children || []
    expect(!!findChild(listGender, (c) => c === image)).to.be.true
    expect(!!findChild(listGender, (c) => c === label)).to.be.true
    const [newNode, newComponent] = ndom.redraw(node, listGender)
    expect(!!findChild(newComponent, (c) => c === image)).to.be.false
    expect(!!findChild(newComponent, (c) => c === label)).to.be.false
  })

  it('should set the original parent as the parent of the new redrawee component', async () => {
    const view = createComponent('view')
    const list = await createRender({
      components: [
        mock.getListComponent({ listObject: mock.getGenderListObject() }),
      ],
    }).render()
    view.createChild(list)
    list.setParent(view)
    ndom.draw(view)
    const listItem = list.child() as ListItem
    const liNode = document.getElementById(listItem?.id || '')
    const [newLiNode, newListItem] = ndom.redraw(liNode, listItem)
    expect(newListItem?.parent).to.eq(list)
  })

  it('should set the new component as a child on the original parent', async () => {
    const view = createComponent('view')
    const list = await createRender({
      components: [
        mock.getListComponent({ listObject: mock.getGenderListObject() }),
      ],
    }).render()
    view.createChild(list)
    list.setParent(view)
    ndom.draw(view)
    const listItem = list.child()
    const [empty, newListItem] = ndom.redraw(null, listItem)
    expect(list.children.includes(newListItem)).to.be.true
  })

  it('the redrawing component + node should hold the same ID', async () => {
    ndom.draw(view)
    const list = await createRender({
      components: [
        mock.getListComponent({ listObject: mock.getGenderListObject() }),
      ],
    }).render()
    const listItem = list.child()
    const liNode = document.getElementById(listItem?.id || '')
    const [newLiNode, newListItem] = ndom.redraw(liNode, listItem)
    expect(newLiNode).to.have.property('id').that.is.eq(newListItem.id)
  })

  it('should attach to the original parentNode as the new childNode', async () => {
    const view = createComponent('view')
    const list = await createRender({
      components: [
        mock.getListComponent({ listObject: mock.getGenderListObject() }),
      ],
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

  it('should use every component\'s "shape" as their redraw blueprint', async () => {
    const list = await createRender({
      components: [
        mock.getListComponent({ listObject: mock.getGenderListObject() }),
      ],
    }).render()
    const createIsEqual =
      (noodlComponent: ComponentObject, newInstance: Component) =>
      (prop: string) =>
        noodlComponent[prop] === newInstance.get(prop)
    const node = ndom.draw(list)
    const [newNode, newComponent] = ndom.redraw(node, list)
    const isEqual = createIsEqual(list.original, newComponent)
    u.keys(list.original).forEach((prop) => {
      if (prop === 'children') {
        expect(list.original?.children).to.deep.eq(list?.original?.children)
      } else {
        expect(isEqual(prop as string)).to.be.true
      }
    })
  })

  it('should accept a component resolver to redraw all of its children', async () => {
    const listComponentObject = mock.getListComponent({
      listObject: mock.getGenderListObject(),
    })
    const { render } = createRender({ components: [listComponentObject] })
    const list = await render()
    const createIsEqual =
      (noodlComponent: ComponentObject, newInstance: Component) =>
      (prop: string) =>
        noodlComponent[prop] === newInstance.get(prop)
    const node = ndom.draw(list)
    const [newNode, newComponent] = ndom.redraw(node, list)
    const isEqual = createIsEqual(list.original, newComponent)
    u.keys(list.original).forEach((prop) => {
      if (prop === 'children') {
        expect(list.original.children).to.deep.eq(
          newComponent.original.children,
        )
      } else {
        expect(isEqual(prop as string)).to.be.true
      }
    })
  })

  xdescribe('when using path emits after redrawing', () => {
    it('should still be able to emit and update the DOM', async () => {
      let imgPath = 'selectOn.png'
      const pathSpy = sinon.spy(async () => {
        return imgPath === 'selectOn.png' ? 'selectOff.png' : 'selectOn.png'
      })
      const onClickSpy = sinon.spy(async (action, options) => {
        imgPath = 'selectOn.png' ? 'selectOff.png' : 'selectOn.png'
        return ['']
      })
      NOODLDOM._nui.use({
        actionType: 'emit',
        fn: pathSpy,
        trigger: 'path',
      } as any)
      NOODLDOM._nui.use({
        actionType: 'emit',
        fn: onClickSpy,
        trigger: 'onClick',
      } as any)
      ndom.on('image', (n: HTMLInputElement, c) => {
        n.setAttribute('src', c.get('src'))
        n.onclick = async (e) => {
          await c.get('onClick')(e)
        }
      })
      const view = NOODLDOM._nui.resolveComponents({
        type: 'view',
        children: [
          {
            type: 'image',
            path: { emit: { dataKey: { var1: 'hello' }, actions: [] } },
            onClick: [{ emit: { dataKey: { var1: 'hello' }, actions: [] } }],
          },
        ],
      })
      const image = view.child() as Component
      ndom.draw(view)
      await image.get('onClick')()

      ndom.redraw(document.querySelector('img'), image)
      const img = document.querySelector('img')
      // img?.click()
      await waitFor(() => {
        expect(onClickSpy.called).to.be.true
        // expect(pathSpy.called).to.be.true
        // expect(onClickSpy.called).to.be.true
        // expect(img?.getAttribute('src') || img?.src).to.eq(
        //   NOODLDOM._nui.assetsUrl + imgPath,
        // )
      })
    })
  })

  xdescribe('when user clicks on a redrawed node that has an onClick emit', () => {
    it('should still be able to operate on and update the DOM', async () => {
      const abc = 'abc.png'
      const hello = 'hello.jpeg'
      const state = { url: abc }

      const onClick = async (action, { component }) => {
        state.url = state.url === abc ? hello : abc
        NOODLDOM._nui.use({ getRoot: () => ({ SignIn: { url: 'hehehehe' } }) })
        ndom.redraw(document.getElementById(component.id), component)
      }

      NOODLDOM._nui
      NOODLDOM._nui
        .setPage('SignIn')
        .use({ actionType: 'emit', fn: async () => state.url, trigger: 'path' })
        .use({ actionType: 'emit', fn: onClick, trigger: 'onClick' })

      // image = NOODLDOM._nui.resolveComponents({
      //   type: 'image',
      //   path: { emit: { dataKey: { var1: 'hello' }, actions: [] } },
      //   onClick: [{ emit: { dataKey: { var1: 'itemObject' }, actions: [] } }],
      // }) as Component

      ndom.on('image', (n, c) => {
        n.onclick = c.get('onClick')
        // ndom.redraw(n, c)
      })

      const listItem = NOODLDOM._nui.resolveComponents({
        type: 'listItem',
        children: [
          {
            type: 'image',
            path: { emit: { dataKey: { var1: 'hello' }, actions: [] } },
            onClick: [
              { emit: { dataKey: { var1: 'itemObject' }, actions: [] } },
            ],
          },
        ],
      })

      ndom.draw(listItem)

      await waitFor(() => {
        expect(document.querySelector('img')?.src).to.eq(assetsUrl + abc)
        ndom.redraw(document.querySelector('li'), listItem, {
          resolver: (c: any) => NOODLDOM._nui.resolveComponents(c),
        })
        // expect(document.querySelector('img')?.src).to.eq(assetsUrl + hello)
      })
    })

    xit(
      'path emit should be delayed until after the onClick / onChange emit ' +
        'actions are done when clicked/changed from the user ' +
        '(race conditions delays the finalized src re-evaluation',
      () => {
        //
      },
    )

    xit(
      'should be able to toggle off right away if it starts off with a ' +
        'toggled state',
      async (done) => {
        const state = { pathValue: 'myimg.png' }
        const pathSpy = sinon.sfpy(async () => state.pathValue)
        const onClickSpy = sinon.spy(async (action, options) => {
          state.pathValue = 'myotherimg.png'
          return ['']
        })
        NOODLDOM._nui
          .use([
            { actionType: 'emit', fn: pathSpy, trigger: 'path' },
            { actionType: 'emit', fn: onClickSpy, trigger: 'onClick' },
          ])
          .use({
            actionType: 'builtIn',
            funcName: 'redraw',
            fn: async (a, { component }) =>
              void ndom.redraw(
                document.getElementById(component.id),
                component,
              ),
          })
        const view = NOODLDOM._nui.resolveComponents({
          type: 'view',
          children: [
            {
              type: 'image',
              onClick: [
                { emit: { var1: 'hello' }, actions: [] },
                {
                  actionType: 'builtIn',
                  funcName: 'redraw',
                  viewTag: 'genderTag',
                },
              ],
              path: { emit: { var1: 'hello' }, actions: [] },
              viewTag: 'genderTag',
            },
          ],
        })
        const image = view.child() as Component
        const node = ndom.draw(image)
        await waitFor(() => {
          const imgNode = document.querySelector(
            `img[src=${assetsUrl + 'myimg.png'}]`,
          )
          expect(imgNode).to.exist
        })
        const [newNode, newComponent] = ndom.redraw(node, image)
      },
    )
  })

  xdescribe('when user types something on a redrawed input node that had an onChange emit', () => {
    it('should still be emitting and updating the DOM', () => {
      const mockOnChangeEmit = async (action, { node, component }) => {
        node.setAttribute('placeholder', component.get('data-value'))
      }
      NOODLDOM._nui
        .use({ getRoot: () => ({ formData: { password: 'mypassword' } }) })
        .setPage('Abc')
      NOODLDOM._nui.use({
        actionType: 'emit',
        fn: mockOnChangeEmit as any,
        trigger: 'onChange',
        context: {},
      })
      const view = NOODLDOM._nui.resolveComponents({
        type: 'view',
        children: [{ type: 'textField', dataKey: 'formData.password' }],
      })
      const textField = view.child() as Component
      ndom.on('textField', (node: HTMLInputElement, c) => {
        node.dataset.value = c.get('data-value') || ''
        node.value = c.get('data-value') || ''

        node.onchange = function (e) {
          node.dataset.value = e.value
          throw new Error('i ran')
        }
        node.addEventListener('change', (e) => {
          throw new Error('i ran')
        })
      })
      const container = ndom.draw(view)
      const input = screen.getByDisplayValue('mypassword')
      // expect(input.dataset.value).to.eq('mypassword')
      expect(input.value).to.eq('mypassword')
      userEvent.clear(input)
      userEvent.type(input, 'iwasadded')
      // expect(input.dataset.value).to.eq('iwasadded')
      expect(input.value).to.eq('iwasadded')
    })
  })

  xit(
    'action chains should still be able to operate on the DOM without ' +
      'having to re-assign them',
    () => {
      ndom.on('textField', function (n: HTMLInputElement, c) {
        n.onchange = (e) => {
          e.value = !e.value
        }
      })
      ndom.on('image', (n: HTMLImageElement, c) => {
        n.onclick = (e) => {
          const targetId = 'targetme'
          let targetNode = document.getElementById(targetId)
          if (targetNode) {
            targetNode.remove()
          } else {
            targetNode = document.createElement('div')
            targetNode.id = targetId
            document.body.appendChild(targetNode)
          }
          targetNode = null
        }
      })

      const input = document.createElement('input')
      const img = document.createElement('img')
      const noodlView = {
        type: 'view',
        children: [
          {
            type: 'textField',
            dataKey: 'formData.email',
            placeholder: 'some placeholder',
          },
          {
            type: 'image',
            path: { emit: { dataKey: { var: 'hello' }, actions: [] } },
          },
          {
            type: 'button',
            onClick: [
              { emit: { dataKey: { var1: 'myonclickvar' }, actions: [] } },
            ],
            style: { border: { style: '4' } },
          },
        ],
      }
      const view = NOODLDOM._nui.resolveComponents(noodlView)
      input.id = 'mocknodeid'
      const [textField, image, button] = view.children

      let inputValue = 'yes value'
      let imgSrc = 'selectOn.png'

      const mockOnClick = async (action, { component }) => {
        // calls emit path
      }

      const mockOnChange = async (action, { component }) => {
        return inputValue === 'yes value' ? 'no value' : 'yes value'
      }

      const mockPathEmit = async (
        { pageName, path, component },
        context: any,
      ) => {
        return imgSrc === 'selectOn.png' ? 'selectOff.png' : 'selectOn.png'
      }

      NOODLDOM._nui.use({
        actionType: 'emit',
        fn: mockOnChange,
        trigger: 'onChange',
      })
      NOODLDOM._nui.use([
        { actionType: 'emit', fn: mockPathEmit, trigger: 'path' },
        { actionType: 'emit', fn: mockOnClick, trigger: 'onClick' },
      ])
      const actionChain = {
        onClick: new ActionChain(
          [
            { emit: { dataKey: { var: 'myvar' }, actions: [] } },
            { emit: { dataKey: { var1: 'myvar1' }, actions: [] } },
          ],
          { component: button, trigger: 'onClick' },
        ),
      }
      const container = ndom.draw(view)
      const [newNode, newComponent] = ndom.redraw(
        document.getElementById(button.id),
        button,
        {
          resolver: (c) => NOODLDOM._nui.resolveComponents(c),
        },
      )
      expect(newComponent.action.onClick).to.eq(button?.action.onClick)
      expect(document.getElementById(button.id)).to.be.null
    },
  )

  xit('should deeply resolve the entire noodl-ui component tree down', () => {
    const [newNode, newComponent] = ndom.redraw(null, view)
  })

  it('dom nodes should structurally remain the same in the dom', async () => {
    const pathSpy = sinon.spy(async () => 'food.png')
    const onClickSpy = sinon.spy(async () => [''])
    const iteratorVar = 'hello'
    const listObject = [
      { fruit: 'apple', color: 'red' },
      { fruit: 'orange', color: 'blue' },
    ]
    const { ndom, render } = createRender({
      pageName: 'Abc',
      pageObject: {
        formData: { password: 'mypassword' },
        components: [
          mock.getViewComponent({
            children: [
              mock.getListComponent({
                listObject,
                children: [
                  mock.getListItemComponent({
                    children: [
                      mock.getTextFieldComponent({
                        dataKey: 'formData.password',
                      }),
                      mock.getLabelComponent({
                        dataKey: `${iteratorVar}.fruit`,
                      }),
                      mock.getImageComponent({
                        path: mock.getFoldedEmitObject(),
                        onClick: mock.getFoldedEmitObject(),
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    })
    ndom.use({ emit: { path: pathSpy as any, onClick: onClickSpy } })
    await render()
    expect(findBySelector('ul')).to.be.instanceOf(HTMLUListElement)
    expect(findBySelector('li')).to.have.lengthOf(2)
    expect(findBySelector('img')).to.have.lengthOf(2)
    expect(findBySelector('input')).to.have.lengthOf(2)
    ndom.redraw(
      u.array(findBySelector('li'))[0],
      ndom.cache.component.get(u.array(findBySelector('li'))[0]?.id),
    )
    expect(u.array(findBySelector('ul'))).to.have.lengthOf(1)
    expect(u.array(findBySelector('li'))).to.have.lengthOf(2)
    expect(u.array(findBySelector('img'))).to.have.lengthOf(2)
    expect(u.array(findBySelector('input'))).to.have.lengthOf(2)
  })

  xit('should look like it was originally before the redraw', () => {
    const pathSpy = sinon.spy(async () => 'food.png')
    const onClickSpy = sinon.spy(async () => [''])
    const pathEmitObj = { emit: { dataKey: { var3: 'abc' }, actions: [] } }
    const onClickEmitObj = { emit: { dataKey: { var3: 'abc' }, actions: [] } }
    const iteratorVar = 'hello'
    const listObject = [
      { fruit: 'apple', color: 'red' },
      { fruit: 'orange', color: 'blue' },
    ]
    const { ndom, render } = createRender({
      pageName: 'Abc',
      pageObject: { formData: { password: 'mypassword' } },
    })
    ndom.use({ emit: { path: pathSpy, onClick: onClickSpy } })
    const view = NOODLDOM._nui.resolveComponents({
      type: 'view',
      children: [
        {
          type: 'list',
          iteratorVar,
          listObject,
          children: [
            {
              type: 'listItem',
              [iteratorVar]: '',
              children: [
                { type: 'textField', dataKey: 'formData.password' },
                { type: 'label', dataKey: `${iteratorVar}.fruit` },
                { type: 'image', path: pathEmitObj, onClick: onClickEmitObj },
              ],
            },
          ],
        },
      ],
    })
    // @ts-expect-error
    const list = view.child() as List
    // const data = list.getData().slice()
    // data.forEach((d) => list.removeChild(0))
    // data.forEach((d) => list.removeDataObject(d))
    // data.forEach((d) => list.addDataObject(d))
    // const listItem = list.child() as ListItem
    // const [textField, label, image] = listItem.children
    ndom.on('component', (n, c) => {
      if (c.get('onChange')) n.onchange = c.get('onChange')
      if (c.get('onClick')) n.onclick = c.get('onClick')
    })
    ndom.on('image', (n, c) => {
      // n.src = c.get('src')
    })
    ndom.on('textField', (n, c) => {
      n?.dataset.key = c.get('dataKey')
      n?.dataset.value = c.get('data-value')
      n.value = c.get('data-value')
    })
    ndom.draw(view)
  })
})

xdescribe('redraw(new)', () => {
  let onClickSpy: sinon.SinonSpy<[], Promise<'male.png' | 'female.png'>>
  let pathSpy: sinon.SinonSpy<[], Promise<'male.png' | 'female.png'>>
  let redrawSpy: sinon.SinonSpy<
    [
      node: HTMLElement | null,
      component: Component,
      opts?:
        | {
            dataObject?: any
            resolver?:
              | ((
                  noodlComponent: ComponentObject | ComponentObject[],
                ) => Component)
              | undefined
          }
        | undefined,
    ]
  >
  let viewTag = 'genderTag'
  let view: Component
  let list: List
  let iteratorVar = 'itemObject'
  let listObject: { key: 'gender'; value: 'Male' | 'Female' | 'Other' }[]
  let pageObject = { genderInfo: { gender: 'Female' } }
  let path = 'male.png'

  beforeEach(() => {
    listObject = [
      { key: 'gender', value: 'Male' },
      { key: 'gender', value: 'Female' },
      { key: 'gender', value: 'Other' },
    ]
    pathSpy = sinon.spy(async () =>
      path === 'male.png' ? 'female.png' : 'male.png',
    )
    onClickSpy = sinon.spy(async () => {
      return (path = path === 'male.png' ? 'female.png' : 'male.png')
    })
    redrawSpy = sinon.spy(ndom, 'redraw')
    NOODLDOM._nui.actionsContext = {
      noodl: { emitCall: async () => [''] },
    } as any
    NOODLDOM._nui
      .removeCbs('emit')
      .setPage('SignIn')
      .use({ actionType: 'emit', fn: pathSpy, trigger: 'path' })
      .use({ actionType: 'emit', fn: onClickSpy, trigger: 'onClick' })
      .use({
        getAssetsUrl: () => assetsUrl,
        getRoot: () => ({ SignIn: pageObject }),
      })
    view = NOODLDOM._nui.resolveComponents({
      type: 'view',
      children: [
        {
          type: 'list',
          iteratorVar,
          listObject,
          contentType: 'listObject',
          children: [
            {
              type: 'listItem',
              viewTag,
              children: [
                {
                  type: 'label',
                  dataKey: `${iteratorVar}.value`,
                  iteratorVar,
                },
                createNOODLComponent('image', {
                  path: 'emit',
                  onClick: ['emit', `builtIn:redraw:viewTag:${viewTag}`],
                }),
              ],
            },
          ],
        },
      ],
    } as any)
    list = view.child() as List
    toDOM(view)
  })

  after(() => {
    // save('redrawBuiltInCall.test.json', redrawSpy.args, outputArgs)
  })

  afterEach(() => {
    redrawSpy.restore()
  })

  it('should pass in the viewTag and the dataObject', async () => {
    document.querySelector('img')?.click()
    await waitFor(() => {
      expect(redrawSpy.args[0][2]).to.have.property('viewTag', viewTag)
      expect(redrawSpy.args[0][2]).to.have.property('dataObject')
    })
  })

  it('should gather only the components that have the viewTag if a viewTag is provided', async () => {
    document.querySelector('img')?.click()
    await waitFor(() => {
      expect(redrawSpy.called).to.be.true
      expect(redrawSpy.callCount).to.eq(listObject.length)
    })
  })

  it('should rerender the same amount of nodes it was redrawed with', async () => {
    const img = document.querySelector('img')
    const id = img?.id || ''
    await waitFor(() => {
      expect(document.getElementById(id)).to.exist
      expect(document.querySelector('img')).to.be.instanceOf(HTMLElement)
      document.getElementById(id)?.click()
    })
    await waitFor(() => {
      expect(document.getElementById(id)).not.to.exist
      expect(document.querySelectorAll('li').length).eq(listObject.length)
    })
    await waitFor(() => {
      const liNodes = Array.from(document.querySelectorAll('li'))
      const length = liNodes.length
      for (let index = 0; index < length; index++) {
        const li = liNodes[index]
        // expect(li.children).to.have.lengthOf(
        //   list.original.children[0].children.length,
        // )
      }
      expect(document.querySelector('img')).to.exist
    })
    // expect(document.getElementById(id)).not.to.exist
    let listItem = list.child() as ListItem
  })
})
