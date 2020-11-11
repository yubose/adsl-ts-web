import { expect } from 'chai'
import _ from 'lodash'
import { findChild } from 'noodl-utils'
import _internalResolver from '../resolvers/_internal'
import Component from '../components/Base'
import List from '../components/List'
import ListItem from '../components/ListItem'
import { noodlui } from '../utils/test-utils'
import { IComponentTypeObject, IList } from '../types'

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
    } as IComponentTypeObject

    it('should start with no children (removes the listItem placeholder)', () => {
      const component = new List({ type: 'list', listObject: [] })
      expect(component).to.have.lengthOf(0)
      expect(component.children()).to.have.lengthOf(0)
    })

    it('should have initiated the blueprint using the raw noodl list item component', () => {
      const { iteratorVar } = noodlComponent
      const component = new List(noodlComponent)
      const blueprint = component.getBlueprint()
      expect(blueprint).to.have.property('listId', component.listId)
      expect(blueprint).to.have.property('iteratorVar', iteratorVar)
    })

    xit('should start off with 2 children if listObject has 2 items', () => {
      //
    })

    xit('should start off with 5 children if listObject has 5 items', () => {
      //
    })

    xit('should add the data object when calling addDataObject', () => {
      //
    })

    xit('should emit create.list.item after adding a data object', () => {
      //
    })

    xit('should remove the data object when calling removeDataObject', () => {
      //
    })

    xit('should emit delete.list.item after removing a data object', () => {
      //
    })

    xit('should emit retrieve.list.item after retrieving a data object', () => {
      //
    })

    xit('should update the data object when calling updateDataObject', () => {
      //
    })

    xit('should emit update.list.item after updating a data object', () => {
      //
    })

    xdescribe('when controlling list item components', () => {
      xit('should have assigned the listIndex values accurately', () => {
        const noodlComponent = mock.raw.getNOODLList()
        const component = new List(noodlComponent)
        component
          .children()
          .forEach((child: IListItem, index) =>
            expect(child.listIndex).to.equal(index + 122),
          )
      })

      it('should populate descendant dataKey consumers expectedly', () => {
        const noodlComponent = {
          type: 'list',
          listObject: [
            { title: 'apple', color: 'red' },
            { title: 'banana', color: 'yellow' },
            { title: 'grape', color: 'magenta' },
            { title: 'pear', color: 'tan' },
          ],
          iteratorVar: 'hello',
          children: [
            {
              type: 'listItem',
              children: [
                { type: 'label', dataKey: 'hello.title' },
                {
                  type: 'view',
                  children: [{ type: 'label', dataKey: 'hello.color' }],
                },
              ],
            },
          ],
        }
        const component = new List(noodlComponent)
        const resolvedComponent = noodlui.resolveComponents(component)
        // fs.writeJsonSync(
        //   path.join(__dirname, 'listtest.json'),
        //   component.toJS(),
        //   { spaces: 2 },
        // )

        // console.info(resolvedComponent.children())
      })
    })
  })

  describe('listItem', () => {
    //
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

      // _internalResolver.resolve(component, noodlui.getConsumerOptions())
      _internalResolver.resolve(
        component,
        noodlui.getConsumerOptions({ component }),
      )

      const textField = findChild(component, (child) =>
        /my placeholder/i.test(child?.get('placeholder')),
      )

      expect(textField).to.be.instanceOf(Component)
    })

    xit('should not be inserting multiple children', () => {
      const component = new Component({
        type: 'view',
        children: [
          {
            type: 'list',
            children: [
              { type: 'listItem', children: [], style: {}, viewTag: 'abc' },
            ],
          },
        ],
      })
      _internalResolver.resolve(component, getOptions())
      console.info(component.toJS())
    })
  })
})
