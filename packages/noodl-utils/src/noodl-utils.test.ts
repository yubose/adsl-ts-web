// @ts-nocheck
import { expect } from 'chai'
import sinon from 'sinon'
import { createComponent, Component, List, ListItem } from '../noodl-ui'
import * as n from '.'

let listObject: { key: 'gender'; value: 'Male' | 'Female' | 'Other' }[]
let list: List
let listItem: ListItem
let view: Component

beforeEach(() => {
  listObject = [
    { key: 'gender', value: 'Male' },
    { key: 'gender', value: 'Female' },
    { key: 'gender', value: 'Other' },
  ]
  view = createComponent('view')
  view.createChild(list)
  list = createComponent({ type: 'list', iteratorVar: 'hello', listObject })
  listItem = createComponent('listItem')
  listObject.forEach((d) => list.addDataObject(d))
})

describe('createEmitDataKey', () => {
  const dataObject = { key: 'gender', value: 'Female' }
  const pageObject = { genderInfo: dataObject }
  const root = { Global: {}, MeetingRoomCreate: pageObject }
  const orig = { var1: 'genderInfo', var2: 'genderInfo.key' }

  it('should attach the dataObjects from the paths', () => {
    const dataKey = n.createEmitDataKey(orig, [dataObject, pageObject, root])
    expect(dataKey).to.have.property('var1', dataObject)
    expect(dataKey).to.have.property('var2', 'gender')
  })

  it('should attach the dataObjects using a path', () => {
    const dataKey = n.createEmitDataKey(
      { var1: 'Global', var2: 'MeetingRoomCreate' },
      [dataObject, pageObject, root],
    )
    expect(dataKey).to.have.property('var1', root.Global)
    expect(dataKey).to.have.property('var2', root.MeetingRoomCreate)
  })

  it('should attach the dataObject using a string dataKey', () => {
    expect(
      n.createEmitDataKey('MeetingRoomCreate', [dataObject, pageObject, root]),
    ).to.eq(root.MeetingRoomCreate)
    expect(
      n.createEmitDataKey('genderInfo.value', [dataObject, pageObject, root]),
    ).to.eq('Female')
    expect(n.createEmitDataKey('genderInfo.value', pageObject)).to.eq('Female')
    expect(n.createEmitDataKey('key', dataObject)).to.eq('gender')
  })
})

describe('findDataValue', () => {
  let listId = 'mylistid'
  let listObject = [
    { fruits: ['apple'], color: 'purple' },
    { fruits: ['banana'], color: 'red' },
  ]
  const pageObject = { hello: { name: 'Henry' }, listData: listObject }
  const root = { Bottle: pageObject, Global: { vertex: {} } }
  const iteratorVar = 'hello'

  describe('when using a list consumer component', () => {
    const pageObject = { hello: { name: 'Henry' }, listData: listObject }
    const noodlList = {
      type: 'list',
      iteratorVar,
      listObject,
      children: [],
    } as any
    const noodlListItem = {
      type: 'listItem',
      children: [],
    } as any
    noodlList.children.push(noodlListItem)
    let list: List
    let listItem: ListItem
    let label1: Component
    let label2: Component

    beforeEach(() => {
      list = createComponent(noodlList) as List
      listItem = createComponent(noodlListItem) as ListItem
      label1 = createComponent({
        type: 'label',
        dataKey: noodlList.iteratorVar,
        listIndex: 0,
      })
      label2 = createComponent({
        type: 'label',
        dataKey: `${noodlList.iteratorVar}.fruits`,
        iteratorVar,
        listIndex: 1,
      })
    })

    describe('when the data object is in the listItem instance', () => {
      it('should return the data object by providing a list consumer component', () => {
        list.createChild(listItem as any)
        listItem.createChild(label1)
        listItem.createChild(label2)
        listItem.setDataObject(pageObject.hello)
        expect(n.findListDataObject(label1)).to.eq(listItem.getDataObject())
      })
    })

    describe('when the data object is not in the listItem instance', () => {
      it(
        'should look for the data object in the list instance using the ' +
          'listIndex if available',
        () => {
          list.createChild(listItem as any)
          list.set('listObject', listObject)
          listItem.createChild(label1)
          listItem.createChild(label2)
          listItem.createChild(
            n.createDeepChildren(
              createComponent({ type: 'view', listId, listIndex: 0 }),
              {
                depth: 8,
                injectProps: {
                  last: () => ({
                    type: 'label',
                    iteratorVar: noodlList.iteratorVar,
                    listId,
                    dataKey: `${iteratorVar}.fruits`,
                  }),
                },
              },
            ),
          )
          label1.set('iteratorVar', list.iteratorVar)
          const child3 = listItem.child(2)
          console.info(child3.toJS())
          expect(n.findListDataObject(label1)).to.eq(listObject[0])
        },
      )
    })
  })

  it('should be able to return the data object by using a page object', () => {
    expect(n.findDataValue(pageObject, 'hello.name')).to.eq('Henry')
  })

  it('should be able to return the data object by using a root object', () => {
    expect(n.findDataValue(root, 'Bottle')).to.eq(pageObject)
  })
})

describe('findListDataObject', () => {
  it('should be able to find the dataObject inside listItem', () => {
    const image = createComponent('image')
    listItem.createChild(image)
    list.createChild(listItem)
    listItem.set('listIndex', null)
    expect(n.findListDataObject(image)).not.to.eq(list.getData()[0])
    listItem.setDataObject(list.getData()[0])
    expect(n.findListDataObject(image)).to.eq(list.getData()[0])
  })

  it('should be able to find the dataObject inside list using listIndex', () => {
    const image = createComponent('image')
    listItem.createChild(image)
    list.createChild(listItem)
    listItem.setDataObject(null)
    listItem.set('listIndex', null)
    expect(n.findListDataObject(image)).not.to.eq(list.getData()[0])
    listItem.set('listIndex', 0)
    expect(n.findListDataObject(image)).to.eq(list.getData()[0])
  })
})

describe('findDataValue', () => {
  it('should work with data funcs', () => {
    const dataObject = { rating: 2 }
    const objs = [
      () => ({ fruits: 'apple' }),
      () => ({ doctors: { chris: { rating: 1 }, michael: dataObject } }),
      {},
    ]
    expect(n.findDataValue(objs, 'doctors.michael')).to.eq(dataObject)
  })

  it('should retrieve the value', () => {
    const obj1 = { fruits: ['apple'] }
    const obj2 = { firstName: 'Chris', lastName: 'Le', email: 'pft@gmail.com' }
    const obj3 = {
      a: {
        b: {
          c: { d: { e: { f: ['hello', 1, 2] }, army: { weapons: ['ak47'] } } },
        },
      },
    }
    expect(n.findDataValue([obj1, obj2, obj3], 'a.b.c.d.e.f')).to.eq(
      obj3.a.b.c.d.e.f,
    )
  })

  it('should retrieve the value', () => {
    const obj3 = {
      a: {
        b: {
          c: { d: { e: { f: ['hello', 1, 2] }, army: { weapons: ['ak47'] } } },
        },
      },
    }
    expect(n.findDataValue(obj3, 'a.b.c')).to.eq(obj3.a.b.c)
  })

  it('should retrieve the value', () => {
    const obj1 = { fruits: ['apple'] }
    expect(n.findDataValue(obj1, 'fruits')).to.eq(obj1.fruits)
  })

  it('should retrieve the value', () => {
    const obj1 = { fruits: ['apple'] }
    const obj2 = { firstName: 'Chris', lastName: 'Le', email: 'pft@gmail.com' }
    const obj3 = {
      a: {
        b: {
          c: { d: { e: { f: ['hello', 1, 2] }, army: { weapons: ['ak47'] } } },
        },
      },
    }
    expect(
      n.findDataValue([obj2, obj3, obj1], 'a.b.c.d.army.weapons[0]'),
    ).to.eq('ak47')
  })
})

describe('isBoolean', () => {
  it('should return true', () => {
    expect(n.isBoolean(true)).to.be.true
  })
  it('should return true', () => {
    expect(n.isBoolean('true')).to.be.true
  })
  it('should return true', () => {
    expect(n.isBoolean(false)).to.be.true
  })
  it('should return true', () => {
    expect(n.isBoolean('false')).to.be.true
  })
  it('should return false', () => {
    expect(n.isBoolean('balse')).to.be.false
  })
})

describe('isBreakLineTextBoardItem', () => {
  it('should return false', () => {
    expect(n.isBreakLineTextBoardItem({ text: 'hello' })).to.be.false
  })

  it('should return true', () => {
    expect(n.isBreakLineTextBoardItem({ br: undefined })).to.be.true
  })

  it('should return true', () => {
    expect(n.isBreakLineTextBoardItem('br')).to.be.true
  })
})

describe('publish', () => {
  it('should recursively call the callback', () => {
    const spy = sinon.spy()
    const view = n.createDeepChildren('view', {
      depth: 6,
      injectProps: {
        last: {
          viewTag: 'genderTag',
          style: { border: { style: '2' } },
        },
      },
    })
    n.publish(view, spy)
    expect(spy.callCount).to.eq(6)
    expect(spy.lastCall.args[0].get('viewTag')).to.eq('genderTag')
    expect(spy.lastCall.args[0].style).to.exist
  })
})

describe('findChild', () => {
  it('should be able to find nested children', () => {
    const component = new List()
    const child1 = component.createChild(createComponent('listItem'))
    const childOfChild1 = child1.createChild(createComponent('view'))
    const childOfChildOfChild1 = childOfChild1.createChild('image')
    expect(
      n.findChild(component, (child) => child === childOfChildOfChild1),
    ).to.equal(childOfChildOfChild1)
  })

  it('should be able to find deepy nested children by properties', () => {
    const component = new List()
    const child = component.createChild(createComponent('listItem'))
    const childOfChild = child.createChild(createComponent('view'))
    const childOfChildOfChild = childOfChild.createChild(
      createComponent('label'),
    )
    const textBoard = childOfChildOfChild.createChild(createComponent('label'))
    textBoard.set('textBoard', [
      { text: 'hello' },
      { br: null },
      { text: 'my name is christopher' },
    ])
    expect(
      n.findChild(component, (child) => Array.isArray(child.get('textBoard'))),
    ).to.equal(textBoard)
  })
})

describe('findParent', () => {
  it('should be able to find grand parents by traversing up the chain', () => {
    const component = createComponent({ type: 'view' })
    const child = component.createChild(createComponent('list'))
    const childOfChild = child.createChild(createComponent('listItem'))
    const childOfChildOfChild = childOfChild.createChild(
      createComponent('image'),
    )
    expect(childOfChildOfChild.parent().parent()).to.equal(child)
    expect(childOfChildOfChild.parent().parent().parent()).to.equal(component)
  })
})
