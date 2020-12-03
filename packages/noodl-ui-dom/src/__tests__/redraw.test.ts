import { expect } from 'chai'
import sinon from 'sinon'
import fs from 'fs-extra'
import chalk from 'chalk'
import _ from 'lodash'
import { createDeepChildren, findChild, publish } from 'noodl-utils'
import { prettyDOM, screen, waitFor } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import {
  ActionChain,
  createComponent,
  Component,
  ComponentObject,
  List,
  ListEventId,
  ListItem,
  NOODLComponent,
  ComponentType,
  ActionObject,
  ActionType,
} from 'noodl-ui'
import { assetsUrl, noodlui, noodluidom, toDOM } from '../test-utils'
import EmitRedraw from './helpers/EmitRedraw.json'

export type DataKeyType<K extends string = 'emit' | 'key'> = K
export type PathType = 'emit' | 'if' | 'url'
export type ActionSelection = ActionType | ActionObject
export type ActionsConfig =
  | ActionSelection[]
  | Record<ActionType, ActionObject>
  | { builtIn?: string[] }

export function createNOODLComponent(
  noodlComponent: ComponentType | Partial<ComponentObject>,
  opts?: {
    dataKey?: DataKeyType
    iteratorVar?: string
    onClick?: ActionsConfig
    onChange?: ActionsConfig
    path?: boolean | PathType
  } & Partial<Omit<ComponentObject, 'path' | 'onClick' | 'dataKey'>>,
) {
  const props = {
    ...opts,
    type:
      typeof noodlComponent === 'string' ? noodlComponent : noodlComponent.type,
  } as ComponentObject

  const createActionObjs = (configs: ActionsConfig) => {
    const arr = Array.isArray(configs) ? configs : [configs]
    return arr.reduce((acc, obj) => {
      if (typeof obj === 'string') {
        const parts = obj.split(':')
        const [actionType] = parts
        switch (actionType) {
          case 'builtIn':
            const funcName = parts[1]
            let args = parts
              .slice(2)
              .reduce((acc, keyval) => {
                if (acc.length) {
                  if (!acc[acc.length - 1]) acc[acc.length - 1].push(keyval)
                  if (acc[acc.length - 1].length < 2) {
                    acc[acc.length - 1].push(keyval)
                  } else {
                    acc.push([keyval])
                  }
                } else {
                  acc.push([keyval])
                }
                return acc
              }, [])
              .reduce(
                (acc, [key, val]) => Object.assign(acc, { [key]: val }),
                {},
              )

            return acc.concat({
              actionType: 'builtIn',
              funcName,
              ...(typeof args === 'object' ? args : undefined),
            })
          case 'emit':
            return acc.concat(
              createEmitObj({
                keys: ['hello1', 'hello2'],
                iteratorVar: opts?.iteratorVar,
              }),
            )
          default:
            break
        }
      } else if (obj && !Array.isArray(obj) && typeof obj === 'object') {
        // if 'emit' in obj
        // if 'actionType' in obj
        // etc
      }
      return acc
    }, [] as any[])
  }

  const createDataKey = (type: DataKeyType, opts) =>
    type === 'emit' ? createEmitObj(opts) : opts

  const createEmitObj = (
    opts?:
      | {
          actions?: [any, any, any]
          keys?: string | string[]
          iteratorVar?: string
        }
      | boolean,
  ) => {
    const getPrefilledEmitObj = () => {
      const iteratorVar = (typeof opts === 'object' && opts.iteratorVar) || ''
      return {
        emit: {
          dataKey: {
            var1: iteratorVar || 'itemObject',
            var2: `${iteratorVar || 'itemObject'}.value`,
          },
          actions: [{}, {}, {}],
        },
      }
    }
    if (typeof opts === 'boolean') {
      return getPrefilledEmitObj()
    } else if (!opts?.keys) {
      return getPrefilledEmitObj()
    } else {
      return {
        emit: {
          dataKey: Array.isArray(opts.keys)
            ? opts?.keys.reduce(
                (acc, key, index) =>
                  Object.assign(acc, { [`var${index + 1}`]: key }),
                {},
              )
            : opts?.keys,
        },
      } as EmitObject
    }
  }

  const createPath = (type: PathType | boolean, iteratorVar?: string = '') =>
    type === 'emit'
      ? createEmitObj({ iteratorVar })
      : path === 'if'
      ? { if: [] }
      : path

  if (opts) {
    if (opts.dataKey) props.dataKey = createDataKey(opts.dataKey, opts)
    if (opts.path) props.path = createPath(opts.path)
    if (opts.onClick) props.onClick = createActionObjs(opts.onClick)
    if (opts.onChange) props.onChange = createActionObjs(opts.onChange)
  }

  return props
}

// const save = (data: any) => {
//   fs.writeJsonSync('redraw.json', data, { spaces: 2 })
// }

let noodlView: NOODLComponent
let noodlListDemographics: NOODLComponent
let noodlListGender: NOODLComponent

let components: Component[]
let view: Component
let listDemographics: List
let listGender: List

beforeEach(() => {
  noodluidom.on('component', onComponentAttachId)
  noodlView = EmitRedraw.components[2] as NOODLComponent
  noodlListDemographics = EmitRedraw.components[3].children[2] as NOODLComponent
  noodlListGender = EmitRedraw.components[3].children[3] as NOODLComponent
  components = noodlui.resolveComponents(
    EmitRedraw.components as NOODLComponent[],
  )
  view = components[3] as Component
  listDemographics = view.child(2) as List
  listGender = view.child(3) as List
  {
    // const data = listDemographics.getData().slice()
    // data.forEach((d) => listDemographics.removeDataObject(d))
    // data.forEach((d) => listDemographics.addDataObject(d))
  }
  {
    // const data = listGender.getData().slice()
    // data.forEach((d) => listGender.removeDataObject(d))
    // data.forEach((d) => listGender.addDataObject(d))
  }
})

describe('redraw', () => {
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
    listGender.on('add.data.object', addSpy)
    listGender.on('delete.data.object', deleteSpy)
    listGender.on('retrieve.data.object', retrieveSpy)
    listGender.on('update.data.object', updateSpy)
    evtNames.forEach((evt) => {
      expect(listGender.hasCb(evt as ListEventId, evts[evt])).to.be.true
    })
    const node = noodluidom.parse(listGender)
    noodluidom.redraw(node, listGender)
    evtNames.forEach((evt) => {
      expect(listGender.hasCb(evt as ListEventId, evts[evt])).to.be.false
    })
  })

  it('should remove the parent reference', () => {
    expect(listGender.parent()).to.eq(view)
    const node = noodluidom.parse(listGender)
    noodluidom.redraw(node, listGender)
    expect(listGender.parent()).to.be.null
  })

  it("should remove the component from the parent's children", () => {
    expect(view.hasChild(listGender)).to.be.true
    const node = noodluidom.parse(listGender)
    noodluidom.redraw(node, listGender)
    expect(view.hasChild(listGender)).to.be.false
  })

  xit('should recursively remove child references', () => {
    const node = noodluidom.parse(listGender)
    const listItem = listGender.child()
    const [label, image] = listItem?.children() || []
    expect(!!findChild(listGender, (c) => c === image)).to.be.true
    expect(!!findChild(listGender, (c) => c === label)).to.be.true
    const [newNode, newComponent] = noodluidom.redraw(node, listGender)
    expect(!!findChild(newComponent, (c) => c === image)).to.be.false
    expect(!!findChild(newComponent, (c) => c === label)).to.be.false
  })

  xit('should recursively remove child listeners', async () => {
    const spies = {
      hello: sinon.spy(),
      bye: sinon.spy(),
      fruit: sinon.spy(),
    }
    const node = noodluidom.parse(view)
    listGender.on('add.data.object', spies.hello)
    const listItem = listGender.child() as ListItem
    const label = listItem?.child(0)
    const image = listItem?.child(1)
    image?.on('bye', spies.bye)
    label?.on('fruit', spies.fruit)
    expect(listGender.hasCb('add.data.object', spies.hello)).to.be.true
    expect(image.hasCb('bye', spies.bye)).to.be.true
    expect(label.hasCb('fruit', spies.fruit)).to.be.true
    noodluidom.redraw(node, view)
    expect(listGender.hasCb('add.data.object', spies.hello)).to.be.false
    expect(image.hasCb('bye', spies.bye)).to.be.false
    expect(label.hasCb('fruit', spies.fruit)).to.be.false
  })

  it('should remove the node by the parentNode', () => {
    noodluidom.parse(view)
    const listItem = listGender.child() as ListItem
    const image = listItem?.child(1)
    const imageNode = document.getElementById(image?.id)
    expect(!!imageNode?.parentNode?.contains(imageNode)).to.be.true
    noodluidom.redraw(imageNode, image)
    expect(!!imageNode?.parentNode?.contains(imageNode)).to.be.false
    noodluidom.off('component', onComponentAttachId)
  })

  it('should set the original parent as the parent of the new redrawee component', () => {
    noodluidom.parse(view)
    const listItem = listGender.child() as ListItem
    const liNode = document.getElementById(listItem?.id || '')
    const [newLiNode, newListItem] = noodluidom.redraw(liNode, listItem)
    expect(newListItem.parent()).to.eq(listGender)
  })

  it('should set the new component as a child on the original parent', () => {
    noodluidom.parse(view)
    const listItem = listGender.child() as ListItem
    const [empty, newListItem] = noodluidom.redraw(null, listItem)
    expect(listGender.hasChild(newListItem)).to.be.true
  })

  // it('the redrawing component + node should hold the same ID', () => {
  //   noodluidom.parse(view)
  //   const listItem = listGender.child() as ListItem
  //   const liNode = document.getElementById(listItem?.id || '')
  //   const [newLiNode, newListItem] = noodluidom.redraw(liNode, listItem)
  //   expect(newLiNode).to.have.property('id').that.is.eq(newListItem.id)
  //   noodluidom.off('component', onComponentAttachId)
  // })

  it('should attach to the original parentNode as the new childNode', () => {
    noodluidom.parse(view)
    const listItem = listGender.child() as ListItem
    const liNode = document.getElementById(listItem?.id || '')
    const ulNode = liNode?.parentNode
    expect(ulNode.contains(liNode)).to.be.true
    const [newNode] = noodluidom.redraw(liNode, listItem)
    expect(ulNode.contains(liNode)).to.be.false
    expect(ulNode.children).to.have.length.greaterThan(0)
    expect(newNode.parentNode).to.eq(ulNode)
    noodluidom.off('component', onComponentAttachId)
  })

  it('should use every component\'s "shape" as their redraw blueprint', () => {
    const createIsEqual = (
      noodlComponent: ComponentObject,
      newInstance: Component,
    ) => (prop: string) => noodlComponent[prop] === newInstance.get(prop)
    const node = noodluidom.parse(listDemographics)
    const [newNode, newComponent] = noodluidom.redraw(node, listDemographics)
    const isEqual = createIsEqual(noodlListDemographics, newComponent)
    Object.keys(noodlListDemographics).forEach((prop) => {
      if (prop === 'children') {
        expect(noodlListDemographics?.children).to.deep.eq(
          listDemographics?.original?.children,
        )
      } else {
        expect(isEqual(prop)).to.be.true
      }
    })
  })

  it('should accept a component resolver to redraw all of its children', () => {
    const createIsEqual = (
      noodlComponent: ComponentObject,
      newInstance: Component,
    ) => (prop: string) => noodlComponent[prop] === newInstance.get(prop)
    const node = noodluidom.parse(listGender)
    const [newNode, newComponent] = noodluidom.redraw(node, listGender, {
      resolver: (c) => noodlui.resolveComponents(c),
    })
    const isEqual = createIsEqual(noodlListGender, newComponent)
    Object.keys(noodlListGender).forEach((prop) => {
      if (prop === 'children') {
        expect(noodlListGender.children).to.deep.eq(
          newComponent.original.children,
        )
      } else {
        expect(isEqual(prop)).to.be.true
      }
    })
  })

  describe('when using path emits after redrawing', () => {
    it('should still be able to emit and update the DOM', async () => {
      let imgPath = 'selectOn.png'
      const pathSpy = sinon.spy(async () => {
        return imgPath === 'selectOn.png' ? 'selectOff.png' : 'selectOn.png'
      })
      const onClickSpy = sinon.spy(async (action, options) => {
        imgPath = 'selectOn.png' ? 'selectOff.png' : 'selectOn.png'
        console.info('HELLO ALL')
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
          console.info(`Image oncnlick invoking`, c.get('onClick'))
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
      noodluidom.parse(view)
      await image.get('onClick')()

      noodluidom.redraw(document.querySelector('img'), image)
      const img = document.querySelector('img')
      console.info(noodluidom.getAllCbs())
      // img?.click()
      await waitFor(() => {
        console.info(onClickSpy)
        expect(onClickSpy.called).to.be.true
        // expect(pathSpy.called).to.be.true
        // expect(onClickSpy.called).to.be.true
        // expect(img?.getAttribute('src') || img?.src).to.eq(
        //   noodlui.assetsUrl + imgPath,
        // )
      })
    })
  })

  describe('when user clicks on a redrawed node that has an onClick emit', () => {
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

      noodluidom.parse(listItem)

      await waitFor(() => {
        expect(document.querySelector('img')?.src).to.eq(assetsUrl + abc)
        noodluidom.redraw(document.querySelector('li'), listItem, {
          resolver: (c: any) => noodlui.resolveComponents(c),
        })
        console.info(prettyDOM())
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
        console.info('HELLO')
        console.info(prettyDOM())
        const node = noodluidom.parse(image)
        await waitFor(() => {
          const imgNode = document.querySelector(
            `img[src=${assetsUrl + 'myimg.png'}]`,
          )
          console.info(document.querySelector('img'))
          expect(imgNode).to.exist
        })
        console.info('GOODBYE')
        const [newNode, newComponent] = noodluidom.redraw(node, image)
        console.info(prettyDOM())
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
      const container = noodluidom.parse(view)
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
      const container = noodluidom.parse(view)
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
    noodluidom.parse(list)
    expect(getListNodes()).to.have.lengthOf(1)
    expect(getListItemNodes()).to.have.lengthOf(2)
    expect(getImageNodes()).to.have.lengthOf(2)
    expect(getInputNodes()).to.have.lengthOf(2)
    noodluidom.redraw(list.child(), document.querySelector('listItem'))
    expect(getListNodes()).to.have.lengthOf(1)
    expect(getListItemNodes()).to.have.lengthOf(2)
    expect(getImageNodes()).to.have.lengthOf(2)
    expect(getInputNodes()).to.have.lengthOf(2)
    // console.info(prettyDOM())
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
    noodluidom.parse(view)
    console.info(prettyDOM())
  })
})

describe('redraw(new)', () => {
  let onClickSpy: sinon.SinonSpy<[], Promise<'male.png' | 'female.png'>>
  let pathSpy: sinon.SinonSpy<[], Promise<'male.png' | 'female.png'>>
  let redrawSpy: sinon.SinonSpy<[
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
  ]>
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
