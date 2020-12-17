import { expect } from 'chai'
import sinon from 'sinon'
import chalk from 'chalk'
import _ from 'lodash'
import { findChild } from '../utils/noodl'
import _internalResolver from '../resolvers/_internal'
import Component from '../components/Base'
import List from '../components/List'
import { noodlui } from '../utils/test-utils'
import { ComponentObject } from '../types'
import { event } from '../constants'

describe('_internalResolver', () => {
  describe('list', () => {
    const noodlComponent = {
      type: 'list',
      contentType: 'listObject',
      listObject: [
        {
          id: '',
          name: { hostName: 'Invited Room 1', roomName: 'Test Room 1' },
        },
        {
          id: '',
          name: { hostName: 'Invited Room 2', roomName: 'Test Room 2' },
        },
      ],
      iteratorVar: 'itemObject',
      style: { width: '1', height: '0.5' },
      children: [
        {
          type: 'listItem',
          itemObject: '',
          onClick: [
            {
              actionType: 'updateObject',
              dataKey: 'Global.VideoChatObjStore.reference.edge',
              dataObject: 'itemObject',
            },
            { goto: 'VideoChat' },
          ],
          style: { borderWidth: '1', borderColor: '0x00000011' },
          children: [
            {
              type: 'label',
              dataKey: 'itemObject.name.hostName',
              style: {
                backgroundColor: '0xff8f90ff',
                display: 'inline',
                textAlign: { x: 'center', y: 'center' },
              },
            },
            {
              type: 'label',
              dataKey: 'itemObject.name.roomName',
              style: { fontWeight: 400, fontSize: '16' },
            },
            {
              type: 'view',
              viewTag: 'abc',
              children: [
                {
                  type: 'view',
                  children: [
                    {
                      type: 'image',
                      path: 'rightArrow.png',
                      style: {
                        left: '0.88',
                        top: '0.02',
                        width: '0.07',
                        height: '0.03',
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    } as ComponentObject

    it('should start with no children (removes the listItem placeholder)', () => {
      const component = new List({ type: 'list', listObject: [] })
      expect(component).to.have.lengthOf(0)
      expect(component.children()).to.have.lengthOf(0)
    })

    it('should have initiated the blueprint using the raw noodl list item component', () => {
      const noodlParent = {
        type: 'view',
        children: [],
      }
      const noodlList = {
        type: 'list',
        listObject: [],
        children: [
          {
            type: 'listItem',
            viewTag: 'hello',
            style: { width: '0.2', height: '0.3' },
            children: [
              { type: 'label', dataKey: 'formData.greeting' },
              { type: 'image', path: 'abc.jpg' },
              {
                type: 'view',
                children: [{ type: 'label', dataKey: 'formData.firstName' }],
              },
            ],
          },
        ],
        iteratorVar: 'cat',
      }
      // @ts-expect-error
      noodlParent.children.push(noodlList as any)
      const parent = noodlui.resolveComponents(noodlParent as any)
      const component = parent.child() as any
      const blueprint = component?.getBlueprint()
      expect(blueprint).to.have.property('viewTag', 'hello')
      expect(blueprint.style).to.have.property('width')
      expect(blueprint.style).to.have.property('height')
      expect(blueprint.style).not.to.have.property('top')
      expect(blueprint).to.have.property('listId', component.listId)
      expect(blueprint).to.have.property('iteratorVar', component.iteratorVar)
      expect(blueprint.children).to.have.lengthOf(3)
      expect(blueprint.children?.[0]).to.have.property('type', 'label')
      expect(blueprint.children?.[1]).to.have.property('type', 'image')
      expect(blueprint.children?.[1]).to.have.property('path', `abc.jpg`)
    })

    it('should start off with 2 children if listObject has 2 items', () => {
      const noodlParentComponent = {
        type: 'view',
        children: [],
      }
      // @ts-expect-error
      noodlParentComponent.children.push(noodlComponent)
      const parent = noodlui.resolveComponents(noodlParentComponent as any)
      const component = parent.child() as any
      const data = component.getData()
      component.set('listObject', [])
      data.forEach((d: any) => component.addDataObject(d))
      expect(component).to.have.lengthOf(2)
    })

    it('should start off with 5 children if listObject has 5 items', () => {
      const noodlParentComponent = {
        type: 'view',
        children: [],
      } as any
      noodlParentComponent.children.push({
        ...noodlComponent,
        // @ts-expect-error
        listObject: [...noodlComponent.listObject, {}, {}, {}] as any,
      })
      const parent = noodlui.resolveComponents(noodlParentComponent)
      const component = parent.child() as any
      const data = component.getData()
      component.set('listObject', [])
      data.forEach((d) => component.addDataObject(d))
      expect(component).to.have.lengthOf(5)
    })

    it(`should emit ${chalk.yellow(
      event.component.list.CREATE_LIST_ITEM,
    )} after adding a data object`, () => {
      const spy = sinon.spy()
      const parent = noodlui.resolveComponents({
        type: 'view',
        children: [noodlComponent],
      }) as any
      const component = parent.child() as List
      component.on(event.component.list.CREATE_LIST_ITEM, spy)
      component.addDataObject({ hello: 'true' })
      expect(spy.called).to.be.true
    })

    it(`should emit ${chalk.yellow(
      event.component.list.REMOVE_LIST_ITEM,
    )} after removing a data object`, () => {
      const spy = sinon.spy()
      const parent = noodlui.resolveComponents({
        type: 'view',
        children: [noodlComponent],
      }) as any
      const component = parent.child() as List
      expect(spy.called).to.be.false
      component.on(event.component.list.REMOVE_LIST_ITEM, spy)
      component.removeDataObject(1)
      expect(spy.called).to.be.true
    })

    it('should update the data object when calling updateDataObject', () => {
      const parent = noodlui.resolveComponents({
        type: 'view',
        children: [noodlComponent],
      }) as any
      const component = parent.child() as List
      const data = component.getData()
      component.set('listObject', [])
      data.forEach((d) => component.addDataObject(d))
      component.updateDataObject(0, { greeting: 'hello' })
      expect(component.getDataObject(0).dataObject).to.have.property(
        'greeting',
        'hello',
      )
    })

    it(`should emit ${chalk.yellow(
      event.component.list.UPDATE_LIST_ITEM,
    )} after updating a data object`, () => {
      const spy = sinon.spy()
      const parent = noodlui.resolveComponents({
        type: 'view',
        children: [noodlComponent],
      }) as any
      const component = parent.child() as List
      const data = component.getData()
      data.forEach((d) => component.addDataObject(d))
      component.on(event.component.list.UPDATE_LIST_ITEM, spy)
      expect(spy.called).to.be.false
      component.updateDataObject(1, { hello: 'true', fruit: 'apple' })
      expect(spy.called).to.be.true
    })

    it('should deeply assign iteratorVar and listId to all of its children', () => {
      const dataObject1 = { title: 'This is my title', color: 'red' }
      const dataObject2 = { title: 'This is 2md title', color: 'brown' }
      const dataObject3 = { title: 'This is 3rd title', color: 'cyan' }
      const listObject = [dataObject1, dataObject2, dataObject3]
      const iteratorVar = 'hello'
      const noodlComponent = {
        type: 'list',
        listObject,
        iteratorVar,
        children: [
          {
            type: 'listItem',
            hello: '',
            children: [
              { type: 'label', dataKey: 'hello.title' },
              {
                type: 'view',
                children: [
                  { type: 'label', dataKey: 'hello.color' },
                  {
                    type: 'view',
                    children: [
                      {
                        type: 'view',
                        children: [
                          {
                            type: 'image',
                            path: 'abc.png',
                            style: { width: '0.2', height: '0.5' },
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      }
      noodlui
        .use({
          getRoot: () => ({ SignIn: { listData: { someList: listObject } } }),
        })
        .setPage('SignIn')
      const noodlParent = { type: 'view', children: [noodlComponent] }
      const parent = noodlui.resolveComponents(noodlParent as any)
      const component = parent.child() as any
      const data = component.getData()
      component?.set('listObject', [])
      data.forEach((d: any) => component.addDataObject(d))
      const [listItem1] = component?.children() || []
      expect(listItem1.child()?.get?.('listId')).to.exist
      expect(listItem1.child()?.get?.('iteratorVar')).to.exist
      expect(listItem1.child(1)?.child(0)?.get('listId')).to.exist
      expect(listItem1.child(1)?.child(0)?.get('iteratorVar')).to.exist
    })

    it('should populate all descendant dataKey consumers expectedly', () => {
      const dataObject1 = { title: 'This is my title', color: 'red' }
      const dataObject2 = { title: 'This is 2md title', color: 'brown' }
      const dataObject3 = { title: 'This is 3rd title', color: 'cyan' }
      const listObject = [dataObject1, dataObject2, dataObject3]
      const iteratorVar = 'hello'
      const noodlComponent = {
        type: 'list',
        listObject,
        iteratorVar,
        children: [
          {
            type: 'listItem',
            hello: '',
            children: [
              { type: 'label', dataKey: `${iteratorVar}.title` },
              {
                type: 'view',
                children: [
                  { type: 'label', dataKey: `${iteratorVar}.color` },
                  {
                    type: 'view',
                    children: [
                      {
                        type: 'view',
                        children: [
                          {
                            type: 'image',
                            path: 'abc.png',
                            style: { width: '0.2', height: '0.5' },
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      }
      const noodlParent = { type: 'view', children: [noodlComponent] }
      const parent = noodlui.resolveComponents(noodlParent as any)
      // @ts-expect-error
      const list = parent.child() as List
      const data = list.getData()
      list?.set('listObject', [])
      data.forEach((d) => list.addDataObject(d))
      const [listItem1] = list?.children() || []
      expect(listItem1.child()?.get?.('data-value')).to.equal(dataObject1.title)
      // expect(listItem1.child(1)?.child(0)?.get('data-value')).to.equal(
      //   dataObject1.color,
      // )
      // expect(
      //   listItem1.child(1)?.child(1)?.child(0)?.child(0)?.get('src'),
      // ).to.equal(noodlui.assetsUrl + 'abc.png')
    })
  })

  describe('textBoard', () => {
    it('should create label child components for "text" items', () => {
      const parent = noodlui.resolveComponents({
        type: 'view',
        children: [
          {
            type: 'label',
            textBoard: [{ text: 'hello' }, { text: 'bye' }],
          },
        ],
      })
      const label = parent.child()
      expect(label?.child()).to.have.property('noodlType', 'label')
    })

    it('should create br child components for "br" items', () => {
      const parent = noodlui.resolveComponents({
        type: 'view',
        children: [
          {
            type: 'label',
            textBoard: [{ br: null }, { text: 'hello' }, { br: null }],
          },
        ],
      } as any)
      const label = parent.child()
      expect(label?.child(0)).to.have.property('noodlType', 'br')
      expect(label?.child(1)).to.have.property('noodlType', 'label')
      expect(label?.child(2)).to.have.property('noodlType', 'br')
    })

    it('items should not be wrapped by resolveComponent', () => {
      const parent = noodlui.resolveComponents({
        type: 'view',
        children: [
          {
            type: 'label',
            textBoard: [{ br: null }, { text: 'hello' }, { br: null }],
          },
        ],
      } as any)
      const label = parent.child() as Component
      const br = label.child(0)
      const text = label.child(1)
      expect(br?.style).not.to.have.property('position')
      expect(br?.style).not.to.have.property('outline')
      expect(text?.style).not.to.have.property('position')
      expect(text?.style).not.to.have.property('outline')
    })
  })

  describe('other components', () => {
    it('should be deeply resolving children all the way down', () => {
      const component = new Component({
        type: 'view',
        id: '1',
        children: [
          {
            id: '2',
            type: 'view',
            children: [
              {
                id: '3',
                type: 'view',
                children: [
                  { type: 'label', text: 'hello', id: '3a' },
                  { type: 'label', text: 'bye', id: '3b' },
                  {
                    type: 'button',
                    id: '3c',
                    onClick: [
                      {
                        actionType: 'pageJump',
                        destination: 'www.google.com',
                      },
                    ],
                  },
                  {
                    type: 'view',
                    id: '4',
                    children: [
                      {
                        id: '5',
                        type: 'view',
                        children: [
                          {
                            id: '6',
                            type: 'label',
                            required: 'true',
                            style: { shadow: 'true' },
                            text: 'i am the last children',
                          },
                          {
                            id: '7',
                            type: 'view',
                            children: [
                              {
                                id: '8',
                                type: 'textField',
                                placeholder: 'my placeholder',
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
                style: {},
                viewTag: 'abc',
              },
            ],
          },
        ],
      })

      _internalResolver.resolve(
        component,
        noodlui.getConsumerOptions({ component }),
      )

      const textField = findChild(component, (child) =>
        /my placeholder/i.test(child?.get('placeholder') as string),
      )

      expect(textField).to.be.instanceOf(Component)
    })
  })
})
