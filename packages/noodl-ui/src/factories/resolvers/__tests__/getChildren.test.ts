import _ from 'lodash'
import { expect } from 'chai'
import { makeResolverTest, ResolverTest } from '../../utils/test-utils'
import {
  NOODLComponent,
  NOODLComponentProps,
  ProxiedComponent,
} from '../../types'
import { forEachDeepEntries } from '../../utils/common'

let resolve: ResolverTest

beforeEach(() => {
  resolve = makeResolverTest()
})

describe('getChildren', () => {
  describe('listChildren', () => {
    let component: NOODLComponent

    beforeEach(() => {
      component = getMockListComponent()
    })

    it.skip('should use the "iteratorVar" prop to attach it as a key and use it to find the data object as its value', () => {
      const dataObject = { fruit: 'apple' }
      delete component.children[0].itemObject
      // @ts-expect-error
      component.children[0].fiveo = dataObject
      _.forEach(component.children[0].children, (child) => {
        if (child.dataKey && child.dataKey.startsWith('itemObject')) {
          child.dataKey = child.dataKey.replace('itemObject', 'fiveo')
        }
      })
      const resolvedComponent = resolve({ ...component, iteratorVar: 'fiveo' })
    })

    it('should pass down an "itemObject" property to each of its list item children', () => {
      const resolvedComponent = resolve(component)
      const listItem = resolvedComponent.children?.[0]
      const listItem2 = resolvedComponent.children?.[1]
      expect(listItem).to.have.deep.property(
        'itemObject',
        component.listObject?.[0],
      )
      expect(listItem2).to.have.deep.property(
        'itemObject',
        component.listObject?.[1],
      )
    })

    it('should use the first child in its childrens list as a blueprint to resolve its siblings', () => {
      const blueprint = component.children?.[0]
      const resolvedComponent = resolve(component)
      const listItem1 = resolvedComponent.children?.[0]
      const listItem2 = resolvedComponent.children?.[1]
      expect(listItem1?.type).to.eq(blueprint.type)
      expect(listItem1?.onClick).to.deep.eq(blueprint.onClick)
      expect(listItem2?.onClick).to.deep.eq(blueprint.onClick)
    })

    it('should pass down "listId" to each direct child', () => {
      const resolvedComponent = resolve({ ...component, id: 'abc' })
      const { children } = resolvedComponent
      _.forEach(children as NOODLComponentProps[], (child) => {
        expect(child.listId).to.eq('abc')
      })
    })

    it('should pass down "listItemIndex" to each of its children', () => {
      const resolvedComponent = resolve(component)
      const { children } = resolvedComponent
      _.forEach(children as NOODLComponentProps[], (child, index) => {
        expect(child).to.have.property('listItemIndex', index)
      })
    })
  })

  describe('listItemChildren', () => {
    let component: ProxiedComponent

    beforeEach(() => {
      component = getMockListComponent()
    })

    it('should have an itemObject', () => {
      const resolvedComponent = resolve(component)
      const listItem1 = resolvedComponent.children?.[0]
      const listItem2 = resolvedComponent.children?.[1]
      expect(listItem1).to.have.deep.property(
        'itemObject',
        resolvedComponent.listObject?.[0],
      )
      expect(listItem2).to.have.deep.property(
        'itemObject',
        resolvedComponent.listObject?.[1],
      )
    })

    it('should have a listId', () => {
      const resolvedComponent = resolve({ ...component, id: 'abc' })
      const listItem1 = resolvedComponent.children?.[0]
      const listItem2 = resolvedComponent.children?.[1]
      expect(listItem1).to.have.property('listId', 'abc')
      expect(listItem2).to.have.property('listId', 'abc')
    })

    it('should have a listItemIndex', () => {
      const resolvedComponent = resolve(component)
      const listItem1 = resolvedComponent.children?.[0]
      const listItem2 = resolvedComponent.children?.[1]
      expect(listItem1).to.have.property('listItemIndex', 0)
      expect(listItem2).to.have.property('listItemIndex', 1)
    })

    it('should have an iteratorVar', () => {
      component.iteratorVar = 'apple'
      const resolvedComponent = resolve(component)
      const listItem1 = resolvedComponent.children?.[0]
      const listItem2 = resolvedComponent.children?.[1]
      expect(listItem1).to.have.property('iteratorVar', 'apple')
      expect(listItem2).to.have.property('iteratorVar', 'apple')
    })
  })

  describe('listItemItemObjectConsumer', () => {
    let component: ProxiedComponent

    beforeEach(() => {
      component = getMockListComponent()
    })

    it('should receive the the data value if dataKey points directly to the list item object mapped by iteratorVar', () => {
      const iteratorVar = 'apple'
      component.iteratorVar = iteratorVar
      forEachDeepEntries(component, (key, value, obj) => {
        if (_.isString(value) && value.startsWith('itemObject')) {
          obj[key] = value.replace('itemObject', iteratorVar)
        }
      })
      const resolvedComponent = resolve(component)
      expect(resolvedComponent.children[0].children[0]).to.have.property(
        'text',
        'Invited Room 1',
      )
      expect(resolvedComponent.children[0].children[1]).to.have.property(
        'text',
        'Test Room 1',
      )
    })
  })
})

function getMockListComponent(): NOODLComponent {
  return {
    type: 'list',
    contentType: 'listObject',
    listObject: [
      {
        id: '',
        name: {
          hostName: 'Invited Room 1',
          roomName: 'Test Room 1',
        },
        type: '0',
        ctime: '',
        subtype: '',
        bvid: '',
        evid: '',
        tage: '',
      },
      {
        id: '',
        name: {
          hostName: 'Invited Room 2',
          roomName: 'Test Room 2',
        },
        type: '0',
        ctime: '',
        subtype: '',
        bvid: '',
        evid: '',
        tage: '',
      },
    ],
    iteratorVar: 'itemObject',
    style: {
      left: '0',
      top: '0.2',
      width: '1',
      height: '0.8',
    },
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
          {
            actionType: 'pageJump',
            destination: 'VideoChat',
          },
        ],
        style: {
          left: '0',
          top: '0',
          width: '1',
          height: '0.15',
          border: {
            style: '2',
          },
          borderWidth: '1',
          borderColor: '0x00000011',
        },
        children: [
          {
            type: 'label',
            dataKey: 'itemObject.name.hostName',
            style: {
              left: '0.08',
              top: '0.03',
              width: '0.15',
              height: '0.08',
              fontSize: '32',
              fontStyle: 'bold',
              color: '0xffffffff',
              backgroundColor: '0xff8f90ff',
              display: 'inline',
              textAlign: {
                x: 'center',
                y: 'center',
              },
            },
          },
          {
            type: 'label',
            dataKey: 'itemObject.name.roomName',
            style: {
              left: '0.25',
              top: '0.06',
              width: '0.74',
              height: '0.03',
              fontSize: '18',
              color: '0x000000ff',
            },
          },
          {
            type: 'image',
            path: 'rightArrow.png',
            style: {
              left: '0.88',
              top: '0.02',
              width: '0.08',
              height: '0.04',
            },
          },
        ],
      },
    ],
  }
}
