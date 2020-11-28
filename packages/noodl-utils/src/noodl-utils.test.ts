import { expect } from 'chai'
import sinon from 'sinon'
import {
  createComponent,
  IComponentTypeInstance,
  IList,
  IListItem,
  List,
  ListItem,
} from 'noodl-ui'
import * as n from '.'

let listObject: { key: 'gender'; value: 'Male' | 'Female' | 'Other' }[]
let list: IList
let listItem: IListItem
let view: IComponentTypeInstance

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

describe('findDataObject', () => {
  const listObject = [
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
    let label1: IComponentTypeInstance
    let label2: IComponentTypeInstance

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
        expect(n.findDataObject(pageObject, { component: label1 })).to.eq(
          listItem.getDataObject(),
        )
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
          label1.set('iteratorVar', list.iteratorVar)
          expect(n.findDataObject(label1)).to.eq(listObject[0])
        },
      )
    })
  })

  it('should be able to return the data object by using a page object', () => {
    expect(n.findDataObject(pageObject, 'hello.name')).to.eq('Henry')
  })

  it('should be able to return the data object by using a root object', () => {
    expect(n.findDataObject(root, 'Bottle')).to.eq(pageObject)
  })
})

describe('findDataValue', () => {
  const obj1 = { fruits: ['apple'] }
  const obj2 = { firstName: 'Chris', lastName: 'Le', email: 'pft@gmail.com' }
  const obj3 = {
    a: {
      b: {
        c: { d: { e: { f: ['hello', 1, 2] }, army: { weapons: ['ak47'] } } },
      },
    },
  }

  it('should retrieve the value', () => {
    expect(n.findDataValue([obj1, obj2, obj3], 'a.b.c.d.e.f')).to.eq(
      obj3.a.b.c.d.e.f,
    )
  })

  it('should retrieve the value', () => {
    expect(n.findDataValue(obj3, 'a.b.c')).to.eq(obj3.a.b.c)
  })

  it('should retrieve the value', () => {
    expect(n.findDataValue(obj1, 'fruits')).to.eq(obj1.fruits)
  })

  it('should retrieve the value', () => {
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

  xit('should return true', () => {
    expect(n.isBreakLineTextBoardItem({ br: undefined })).to.be.true
  })

  xit('should return true', () => {
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

xdescribe('findChild', () => {
  it('should be able to find nested children', () => {
    const component = new List()
    const child1 = component.createChild(createComponent('listItem'))
    const childOfChild1 = child1.createChild('view')
    const childOfChildOfChild1 = childOfChild1.createChild('image')
    expect(
      n.findChild(component, (child) => child === childOfChildOfChild1),
    ).to.equal(childOfChildOfChild1)
  })

  it('should be able to find deepy nested children by properties', () => {
    const component = new List()
    const child = component.createChild('listItem')
    const childOfChild = child.createChild('view')
    const childOfChildOfChild = childOfChild.createChild('label')
    const textBoard = childOfChildOfChild.createChild('label')
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

// describe('findParent', () => {
//   it('should be able to find grand parents by traversing up the chain', () => {
//     const component = new Component({ type: 'view' })
//     const child = component.createChild('list')
//     const childOfChild = child.createChild('listItem')
//     const childOfChildOfChild = childOfChild.createChild('image')
//     expect(childOfChildOfChild.parent().parent()).to.equal(child)
//     expect(childOfChildOfChild.parent().parent().parent()).to.equal(component)
//   })
// })

// describe('findList', () => {
//   let component1: IList
//   let component2: IList
//   let component3: IList
//   let component4: IList
//   let component2Child: IComponent
//   let component2ChildChild: IComponent
//   let component2ChildChildChild: IComponent

//   let data = [{ fruits: ['apple', 'banana'] }, { fruits: ['orange'] }]
//   let mapOfLists: Map<IList, IList>

//   beforeEach(() => {
//     component1 = new List()
//     component2 = new List()
//     component3 = new List()
//     component4 = new List()
//     component1.createChild('date')
//     component2Child = component2.createChild('listItem')
//     component2ChildChild = component2Child.createChild('view')
//     component2ChildChildChild = component2ChildChild.createChild('label')
//     component3.createChild('select')
//     component4.createChild('scrollView')
//     component2.set('listObject', data)
//     component3.set('listObject', ['hello?'])
//     mapOfLists = new Map([
//       [component1, component1],
//       [component2, component2],
//       [component3, component3],
//       [component4, component4],
//     ])
//   })

//   it("should be able to return the list by using a list component's id", () => {
//     console.info(component2.id)
//     expect(n.findList(mapOfLists, component2.id)).to.equal(data)
//   })

//   it('should be able to return the list by directly using a list component instance', () => {
//     expect(n.findList(mapOfLists, component2)).to.equal(data)
//   })

//   it("should be able to return the list by using a list item component's id", () => {
//     expect(n.findList(mapOfLists, component2Child.id)).to.equal(data)
//   })

//   it('should be able to return the list by directly using a list item component instance', () => {
//     expect(n.findList(mapOfLists, component2Child)).to.equal(data)
//   })

//   it("should be able to return the list by using a normal component's component id", () => {
//     const result = n.findList(mapOfLists, component2ChildChildChild.id)
//     expect(result).to.equal(data)
//   })

//   it("should be able to return the list by using a deeply nested normal component's instance", () => {
//     const result = n.findList(mapOfLists, component2ChildChildChild)
//     expect(result).to.equal(data)
//   })
// })
