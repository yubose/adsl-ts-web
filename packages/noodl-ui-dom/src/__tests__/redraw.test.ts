import sinon from 'sinon'
import { expect } from 'chai'
import { ComponentObject } from 'noodl-types'
import { prettyDOM, screen, waitFor } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import {
  ActionChain,
  Component,
  findChild,
  List,
  ListEventId,
  ListItem,
  ComponentInstance,
  createComponent,
} from 'noodl-ui'
import { assetsUrl, noodlui, noodluidom, toDOM } from '../test-utils'

const getListGender = () =>
  noodlui.resolveComponents({
    type: 'list',
    iteratorVar: 'itemObject',
    listObject: [
      { key: 'gender', value: 'Male' },
      { key: 'gender', value: 'Female' },
      { key: 'gender', value: 'Other' },
    ],
    children: [
      {
        type: 'listItem',
        children: [{ type: 'label', dataKey: 'itemObject.value' }],
      },
    ],
  })

let view: Component
let listGender: List
let componentCache = noodlui.componentCache.bind(
  noodlui,
) as typeof noodlui.componentCache

describe.only('redraw', () => {
  describe(`events`, () => {
    it(`should convert the action chain arrays back to their function handlers`, async () => {
      const [node, component] = toDOM({
        type: 'label',
        onClick: [{ emit: { dataKey: { var1: 'hey' }, actions: [] } }],
      })
      const [newNode, newComponent] = noodluidom.redraw(node, component) as [
        HTMLSelectElement,
        ComponentInstance,
      ]
      expect(component.get('onClick')).to.be.a('function')
      await waitFor(() => {
        expect(newComponent.get('onClick')).to.be.a('function')
      })
    })
  })

  it(`should remove the redrawing components from the component cache`, () => {
    const list = getListGender()
    const node = noodluidom.draw(list) as HTMLUListElement
    const idsToBeRemoved = list.children().map(({ id }) => id)
    expect(componentCache()).to.have.lengthOf(4)
    list
      .children()
      .forEach((child: any) => expect(componentCache().has(child)).to.be.true)
    noodluidom.redraw(node, list)
    idsToBeRemoved.forEach(
      (id: string) => expect(componentCache().has(id)).to.be.false,
    )
  })

  xit(`should add the redrawed components to the component cache`, () => {
    //
  })

  describe(`page component consumers`, () => {
    xit(`should be using their page component's resolveComponents when redrawing`, () => {
      //
    })
  })

  describe('select component', () => {
    it('should render more option children if the data has more items', async () => {
      let options = ['00:00', '00:10']
      let otherOptions = ['00:20', '00:30']
      let [node, component] = toDOM({ type: 'select', options }) as [
        HTMLSelectElement,
        ComponentInstance,
      ]
      let optionsNodes = Array.from(node.options)
      expect(node.options).to.have.lengthOf(2)
      optionsNodes.forEach((optionNode, index) => {
        expect(optionNode.value).to.eq(options[index])
      })
      options.push(...otherOptions)
      let result = noodluidom.redraw(node, component)
      node = result[0] as HTMLSelectElement
      component = result[1]
      expect(node.options).to.have.lengthOf(4)
      for (let index = 0; index < node.options.length; index++) {
        expect(node.options[index].value).to.eq(options[index])
      }
    })

    it('should re-attach the onchange handler', async () => {
      const spy = sinon.spy()
      const options = ['00:00', '00:10', '00:20']
      noodlui.use({ actionType: 'emit', fn: spy, trigger: 'onChange' })
      const [node, component] = noodluidom.redraw(
        ...toDOM({
          type: 'select',
          options,
          onChange: [{ emit: { dataKey: { var1: 'hey' }, actions: [] } }],
        }),
      ) as [HTMLSelectElement, ComponentInstance]
      node.dispatchEvent(new Event('change'))
      expect(node).to.exist
      expect(component).to.exist
      await waitFor(() => {
        expect(spy).to.have.been.called
      })
    })
  })

  it("should clean up the component's listeners", () => {
    const addSpy = sinon.spy()
    const deleteSpy = sinon.spy()
    const retrieveSpy = sinon.spy()
    const updateSpy = sinon.spy()
    const evts = {
      'add.data.object': addSpy,
      'delete.data.object': deleteSpy,
      'retrieve.data.object': retrieveSpy,
      'update.data.object': updateSpy,
    } as const
    const evtNames = Object.keys(evts)
    const list = getListGender()
    list.on('add.data.object', addSpy)
    list.on('delete.data.object', deleteSpy)
    list.on('retrieve.data.object', retrieveSpy)
    list.on('update.data.object', updateSpy)
    evtNames.forEach((evt) => {
      expect(list.hasCb(evt as ListEventId, evts[evt])).to.be.true
    })
    const node = noodluidom.draw(list)
    noodluidom.redraw(node, list)
    evtNames.forEach((evt) => {
      expect(list.hasCb(evt as ListEventId, evts[evt])).to.be.false
    })
  })

  it('should remove the parent reference', () => {
    const view = createComponent('view')
    const list = getListGender()
    list.setParent(view)
    expect(list.parent()).to.eq(view)
    const node = noodluidom.draw(list)
    noodluidom.redraw(node, list)
    expect(list.parent()).to.be.null
  })

  it("should remove the component from the parent's children", () => {
    const view = createComponent('view')
    const list = getListGender()
    view.createChild(list)
    list.setParent(view)
    expect(view.hasChild(list)).to.be.true
    const node = noodluidom.draw(list)
    noodluidom.redraw(node, list)
    expect(view.hasChild(list)).to.be.false
  })

  xit('should recursively remove child references', () => {
    const node = noodluidom.draw(listGender)
    const listItem = listGender.child()
    const [label, image] = listItem?.children() || []
    expect(!!findChild(listGender, (c) => c === image)).to.be.true
    expect(!!findChild(listGender, (c) => c === label)).to.be.true
    const [newNode, newComponent] = noodluidom.redraw(node, listGender)
    expect(!!findChild(newComponent, (c) => c === image)).to.be.false
    expect(!!findChild(newComponent, (c) => c === label)).to.be.false
  })

  xit('should keep the original parent node after redraw', () => {
    const view = createComponent('view')
    const list = getListGender()
    list.setParent(view)
    view.createChild(list)
    const node = noodluidom.draw(view)
    const listItem = list.child() as ListItem
    const image = listItem?.child(1)
    const imageNode = document.getElementById(image?.id)
    const parentNode = imageNode?.parentNode
    expect(!!parentNode?.contains(imageNode)).to.be.true
    // noodluidom.redraw(imageNode, image)
    // expect(!!parentNode?.contains(imageNode)).to.be.false
  })

  it('should set the original parent as the parent of the new redrawee component', () => {
    const view = createComponent('view')
    const list = getListGender()
    view.createChild(list)
    list.setParent(view)
    noodluidom.draw(view)
    const listItem = list.child() as ListItem
    const liNode = document.getElementById(listItem?.id || '')
    const [newLiNode, newListItem] = noodluidom.redraw(liNode, listItem)
    expect(newListItem?.parent()).to.eq(list)
  })

  it('should set the new component as a child on the original parent', () => {
    const view = createComponent('view')
    const list = getListGender()
    view.createChild(list)
    list.setParent(view)
    noodluidom.draw(view)
    const listItem = list.child() as ListItem
    const [empty, newListItem] = noodluidom.redraw(null, listItem)
    expect(list.hasChild(newListItem)).to.be.true
  })

  // it('the redrawing component + node should hold the same ID', () => {
  //   noodluidom.draw(view)
  //   const listItem = listGender.child() as ListItem
  //   const liNode = document.getElementById(listItem?.id || '')
  //   const [newLiNode, newListItem] = noodluidom.redraw(liNode, listItem)
  //   expect(newLiNode).to.have.property('id').that.is.eq(newListItem.id)
  //   noodluidom.off('component', onComponentAttachId)
  // })

  it('should attach to the original parentNode as the new childNode', () => {
    const view = createComponent('view')
    const list = getListGender()
    view.createChild(list)
    list.setParent(view)
    noodluidom.draw(view)
    const listItem = list.child() as ListItem
    const liNode = document.getElementById(listItem?.id || '')
    const ulNode = liNode?.parentNode
    expect(ulNode.contains(liNode)).to.be.true
    const [newNode] = noodluidom.redraw(liNode, listItem)
    expect(ulNode.contains(liNode)).to.be.false
    expect(ulNode.children).to.have.length.greaterThan(0)
    expect(newNode.parentNode).to.eq(ulNode)
  })

  it('should use every component\'s "shape" as their redraw blueprint', () => {
    const list = getListGender()
    const createIsEqual = (
      noodlComponent: ComponentObject,
      newInstance: Component,
    ) => (prop: string) => noodlComponent[prop] === newInstance.get(prop)
    const node = noodluidom.draw(list)
    const [newNode, newComponent] = noodluidom.redraw(node, list)
    const isEqual = createIsEqual(list.original, newComponent)
    Object.keys(list.original).forEach((prop) => {
      if (prop === 'children') {
        expect(list.original?.children).to.deep.eq(list?.original?.children)
      } else {
        expect(isEqual(prop)).to.be.true
      }
    })
  })

  it('should accept a component resolver to redraw all of its children', () => {
    const list = getListGender()
    const createIsEqual = (
      noodlComponent: ComponentObject,
      newInstance: Component,
    ) => (prop: string) => noodlComponent[prop] === newInstance.get(prop)
    const node = noodluidom.draw(list)
    const [newNode, newComponent] = noodluidom.redraw(node, list)
    const isEqual = createIsEqual(list.original, newComponent)
    Object.keys(list.original).forEach((prop) => {
      if (prop === 'children') {
        expect(list.original.children).to.deep.eq(
          newComponent.original.children,
        )
      } else {
        expect(isEqual(prop)).to.be.true
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
      noodlui.use({
        actionType: 'emit',
        fn: pathSpy,
        trigger: 'path',
      } as any)
      noodlui.use({
        actionType: 'emit',
        fn: onClickSpy,
        trigger: 'onClick',
      } as any)
      noodluidom.on('image', (n: HTMLInputElement, c) => {
        n.setAttribute('src', c.get('src'))
        n.onclick = async (e) => {
          await c.get('onClick')(e)
        }
      })
      const view = noodlui.resolveComponents({
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
      noodluidom.draw(view)
      await image.get('onClick')()

      noodluidom.redraw(document.querySelector('img'), image)
      const img = document.querySelector('img')
      // img?.click()
      await waitFor(() => {
        expect(onClickSpy.called).to.be.true
        // expect(pathSpy.called).to.be.true
        // expect(onClickSpy.called).to.be.true
        // expect(img?.getAttribute('src') || img?.src).to.eq(
        //   noodlui.assetsUrl + imgPath,
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
        noodlui.use({ getRoot: () => ({ SignIn: { url: 'hehehehe' } }) })
        noodluidom.redraw(document.getElementById(component.id), component)
      }

      noodlui
      noodlui
        .setPage('SignIn')
        .use({ actionType: 'emit', fn: async () => state.url, trigger: 'path' })
        .use({ actionType: 'emit', fn: onClick, trigger: 'onClick' })

      // image = noodlui.resolveComponents({
      //   type: 'image',
      //   path: { emit: { dataKey: { var1: 'hello' }, actions: [] } },
      //   onClick: [{ emit: { dataKey: { var1: 'itemObject' }, actions: [] } }],
      // }) as Component

      noodluidom.on('image', (n, c) => {
        n.onclick = c.get('onClick')
        // noodluidom.redraw(n, c)
      })

      const listItem = noodlui.resolveComponents({
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

      noodluidom.draw(listItem)

      await waitFor(() => {
        expect(document.querySelector('img')?.src).to.eq(assetsUrl + abc)
        noodluidom.redraw(document.querySelector('li'), listItem, {
          resolver: (c: any) => noodlui.resolveComponents(c),
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
        noodlui
          .use([
            { actionType: 'emit', fn: pathSpy, trigger: 'path' },
            { actionType: 'emit', fn: onClickSpy, trigger: 'onClick' },
          ])
          .use({
            actionType: 'builtIn',
            funcName: 'redraw',
            fn: async (a, { component }) =>
              void noodluidom.redraw(
                document.getElementById(component.id),
                component,
              ),
          })
        const view = noodlui.resolveComponents({
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
        const node = noodluidom.draw(image)
        await waitFor(() => {
          const imgNode = document.querySelector(
            `img[src=${assetsUrl + 'myimg.png'}]`,
          )
          expect(imgNode).to.exist
        })
        const [newNode, newComponent] = noodluidom.redraw(node, image)
      },
    )
  })

  xdescribe('when user types something on a redrawed input node that had an onChange emit', () => {
    it('should still be emitting and updating the DOM', () => {
      const mockOnChangeEmit = async (action, { node, component }) => {
        node.setAttribute('placeholder', component.get('data-value'))
      }
      noodlui
        .use({ getRoot: () => ({ formData: { password: 'mypassword' } }) })
        .setPage('Abc')
      noodlui.use({
        actionType: 'emit',
        fn: mockOnChangeEmit as any,
        trigger: 'onChange',
        context: {},
      })
      const view = noodlui.resolveComponents({
        type: 'view',
        children: [{ type: 'textField', dataKey: 'formData.password' }],
      })
      const textField = view.child() as Component
      noodluidom.on('textField', (node: HTMLInputElement, c) => {
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
      const container = noodluidom.draw(view)
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
      noodluidom.on('textField', function (n: HTMLInputElement, c) {
        n.onchange = (e) => {
          e.value = !e.value
        }
      })
      noodluidom.on('image', (n: HTMLImageElement, c) => {
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
      const view = noodlui.resolveComponents(noodlView)
      input.id = 'mocknodeid'
      const [textField, image, button] = view.children()

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

      noodlui.use({
        actionType: 'emit',
        fn: mockOnChange,
        trigger: 'onChange',
      })
      noodlui.use([
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
      const container = noodluidom.draw(view)
      const [newNode, newComponent] = noodluidom.redraw(
        document.getElementById(button.id),
        button,
        {
          resolver: (c) => noodlui.resolveComponents(c),
        },
      )
      expect(newComponent.action.onClick).to.eq(button?.action.onClick)
      expect(document.getElementById(button.id)).to.be.null
    },
  )

  xit('should deeply resolve the entire noodl-ui component tree down', () => {
    const [newNode, newComponent] = noodluidom.redraw(null, view)
  })

  it('dom nodes should remain in the dom', async () => {
    const pathSpy = sinon.spy(async () => 'food.png')
    const onClickSpy = sinon.spy(async () => [''])
    const pathEmitObj = { emit: { dataKey: { var3: 'abc' }, actions: [] } }
    const onClickEmitObj = { emit: { dataKey: { var3: 'abc' }, actions: [] } }
    const iteratorVar = 'hello'
    const listObject = [
      { fruit: 'apple', color: 'red' },
      { fruit: 'orange', color: 'blue' },
    ]
    noodlui
      .setPage('Abc')
      .use({
        getRoot: () => ({ Abc: { formData: { password: 'mypassword' } } }),
      })
      .use({ actionType: 'emit', fn: pathSpy, trigger: 'path' })
      .use({ actionType: 'emit', fn: onClickSpy, trigger: 'onClick' })
    const view = noodlui.resolveComponents({
      type: 'view',
      children: [
        {
          type: 'list',
          contentType: 'listObject',
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
    } as ComponentObject)
    // @ts-expect-error
    const list = view.child() as List
    const data = list.getData().slice()
    // data.forEach((d) => list.removeChild(0))
    // data.forEach((d) => list.removeDataObject(d))
    // data.forEach((d) => {
    //   const listItem = createComponent(list.getBlueprint()) as ListItem
    //   list.createChild(listItem.setDataObject(d))
    // })
    const getListNodes = () => document.querySelectorAll('ul')
    const getListItemNodes = () => document.querySelectorAll('li')
    const getImageNodes = () => document.querySelectorAll('img')
    const getInputNodes = () => document.querySelectorAll('input')
    noodluidom.draw(list)
    expect(getListNodes()).to.have.lengthOf(1)
    expect(getListItemNodes()).to.have.lengthOf(2)
    expect(getImageNodes()).to.have.lengthOf(2)
    expect(getInputNodes()).to.have.lengthOf(2)
    noodluidom.redraw(list.child(), document.querySelector('listItem'))
    expect(getListNodes()).to.have.lengthOf(1)
    expect(getListItemNodes()).to.have.lengthOf(2)
    expect(getImageNodes()).to.have.lengthOf(2)
    expect(getInputNodes()).to.have.lengthOf(2)
  })

  it('should look like it was originally before the redraw', () => {
    const pathSpy = sinon.spy(async () => 'food.png')
    const onClickSpy = sinon.spy(async () => [''])
    const pathEmitObj = { emit: { dataKey: { var3: 'abc' }, actions: [] } }
    const onClickEmitObj = { emit: { dataKey: { var3: 'abc' }, actions: [] } }
    const iteratorVar = 'hello'
    const listObject = [
      { fruit: 'apple', color: 'red' },
      { fruit: 'orange', color: 'blue' },
    ]
    noodlui
      .setPage('Abc')
      .use({
        getRoot: () => ({ Abc: { formData: { password: 'mypassword' } } }),
      })
      .use({ actionType: 'emit', fn: pathSpy, trigger: 'path' })
      .use({ actionType: 'emit', fn: onClickSpy, trigger: 'onClick' })
    const view = noodlui.resolveComponents({
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
    // const [textField, label, image] = listItem.children()
    noodluidom.on('component', (n, c) => {
      if (c.get('onChange')) n.onchange = c.get('onChange')
      if (c.get('onClick')) n.onclick = c.get('onClick')
    })
    noodluidom.on('image', (n, c) => {
      // n.src = c.get('src')
    })
    noodluidom.on('textField', (n, c) => {
      n?.dataset.key = c.get('dataKey')
      n?.dataset.value = c.get('data-value')
      n.value = c.get('data-value')
    })
    noodluidom.draw(view)
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
    redrawSpy = sinon.spy(noodluidom, 'redraw')
    noodlui.actionsContext = { noodl: { emitCall: async () => [''] } } as any
    noodlui
      .removeCbs('emit')
      .setPage('SignIn')
      .use({ actionType: 'emit', fn: pathSpy, trigger: 'path' })
      .use({ actionType: 'emit', fn: onClickSpy, trigger: 'onClick' })
      .use({
        getAssetsUrl: () => assetsUrl,
        getRoot: () => ({ SignIn: pageObject }),
      })
    view = noodlui.resolveComponents({
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

function onComponentAttachId(node: any, component: any) {
  node && (node.id = component.id)
}

xit('should target the viewTag component/node if available', async () => {
  let currentPath = 'male.png'
  const imagePathSpy = sinon.spy(async () => currentPath)
  const viewTag = 'genderTag'
  const iteratorVar = 'itemObject'
  const listObject = [
    { key: 'gender', value: 'Male' },
    { key: 'gender', value: 'Female' },
    { key: 'gender', value: 'Other' },
  ]
  const redrawSpy = sinon.spy(noodlui.getCbs('builtIn').redraw[0])
  noodlui.actionsContext = { noodl: {} } as any
  noodlui.removeCbs('emit')
  noodlui.getCbs('builtIn').redraw[0] = redrawSpy
  noodlui
    .setPage('SignIn')
    .use({
      actionType: 'emit',
      trigger: 'onClick',
      fn: async () => {
        currentPath = currentPath === 'male.png' ? 'female.png' : 'male.png'
      },
    })
    .use({ actionType: 'emit', trigger: 'path', fn: imagePathSpy })
    .use({ getAssetsUrl: () => assetsUrl, getRoot: () => ({ SignIn: {} }) })
  const view = page.render({
    type: 'view',
    children: [
      {
        type: 'list',
        iteratorVar,
        listObject,
        children: [
          {
            type: 'listItem',
            viewTag,
            children: [
              {
                type: 'image',
                path: { emit: { dataKey: 'f', actions: [] } },
                onClick: [
                  { emit: { dataKey: '', actions: [] } },
                  {
                    actionType: 'builtIn',
                    funcName: 'redraw',
                    viewTag: 'genderTag',
                  },
                ],
              },
              { type: 'label', dataKey: 'gender.value' },
            ],
          },
        ],
      },
    ],
  } as any).components[0]
  const list = view.child() as List
  const listItem = list.child() as ListItem
  const image = listItem.child() as Component
  expect(image.get('src')).not.to.eq(assetsUrl + 'male.png')
  document.getElementById(image.id)?.click()
  await waitFor(() => {
    expect(redrawSpy).to.have.been.called
    expect(document.querySelector('img')?.getAttribute('src')).to.eq(
      assetsUrl + 'female.png',
    )
  })
})

xdescribe('redraw', () => {
  let iteratorVar = 'hello'
  let listObject: { key: 'gender'; value: 'Male' | 'Female' | 'Other' }[]
  let timeSpanOptions: string[]
  let noodlComponents: any

  beforeEach(() => {
    timeSpanOptions = ['00:00', '00:30']
    listObject = [
      { key: 'gender', value: 'Male' },
      { key: 'gender', value: 'Female' },
      { key: 'gender', value: 'Other' },
    ]
    noodlComponents = {
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
              viewTag: 'fruit',
              [iteratorVar]: '',
              children: [{ type: 'label', dataKey: `${iteratorVar}.value` }],
            },
          ],
        },
        {
          type: 'view',
          children: [
            {
              type: 'select',
              contentType: 'TimeCode',
              dataKey: 'BookingSlotsSelect',
              options: [10, 15, 30, 45, 60],
              required: 'true',
              onChange: [
                { emit: { actions: [] } },
                {
                  actionType: 'builtIn',
                  funcName: 'redraw',
                  viewTag: 'AvailableTimeTag',
                },
              ],
            },
            { type: 'label', text: 'Available Time' },
            {
              type: 'view',
              style: {},
              children: [
                {
                  type: 'select',
                  dataKey: 'AvailableTime.timeStart',
                  viewTag: 'AvailableTimeTag',
                  options: timeSpanOptions,
                  required: 'true',
                },
                {
                  type: 'select',
                  viewTag: 'AvailableTimeTag',
                  options: timeSpanOptions,
                  required: 'true',
                  dataKey: 'AvailableTime.timeEnd',
                  style: { left: '0.45' },
                },
              ],
            },
          ],
        },
      ],
    } as any
  })

  it('should be able to grab list consumer components with the viewTag', async () => {
    const emitCall = sinon.spy()
    const redrawSpy = sinon.spy(noodluidom, 'redraw')
    noodlui.init({ actionsContext: { noodl: { emitCall }, noodluidom } })
    // noodlui.getCbs('builtIn').redraw = [spy]
    const view = page.render(noodlComponents).components[0]
    const select = findChild(
      view,
      (c) => c.get('dataKey') === 'BookingSlotsSelect',
    )
    const node = document.getElementById(select.id) as HTMLSelectElement
    await select?.action.onChange()
    await waitFor(() => {
      expect(redrawSpy.called).to.be.true
    })
    redrawSpy.restore()
  })

  xit('should be able to grab non list consumer components with the viewTag', async () => {
    const pageName = 'SelectRedraw'
    const pageObject = {
      ScheduleSettingsTemp: {
        TimeSpan: timeSpanOptions,
      },
    }
    const onChangeSpy = sinon.spy(async () => {
      timeSpanOptions.push(...['01:00', '01:30', '02:00'])
    })
    const redrawFn = noodlui.getCbs('builtIn')?.redraw[0]
    const spy = sinon.spy(redrawFn)
    noodlui
      .setPage(pageName)
      .use({ actionType: 'emit', fn: onChangeSpy, trigger: 'onChange' })
      .use({
        getRoot: () => ({ [pageName]: pageObject }),
        getPageObject: () => pageObject,
      } as any)
    const view = page.render(noodlComponents)
    await waitFor(() => {
      expect(spy).to.have.been.called
    })
  })

  xit('should pair the corresponding node with each grabbed component', () => {
    //
  })
})
