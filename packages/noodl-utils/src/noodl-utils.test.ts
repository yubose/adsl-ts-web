import { expect } from 'chai'
import sinon from 'sinon'
import {
  createComponent,
  IComponentTypeInstance,
  IList,
  IListItem,
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
  const orig = { var1: 'itemObject', var2: 'itemObject.key' }

  it(
    'should attach the dataObject itself if there are no dots in ' +
      'the key and its a list consumer',
    () => {
      expect(
        n.createEmitDataKey(orig, {
          iteratorVar: 'itemObject',
          objs: dataObject,
        }),
      ).to.have.property('var1', dataObject)
    },
  )

  it('should attach the dataObject using a path', () => {
    expect(
      n.createEmitDataKey(
        { ...orig, var2: 'MeetingRoomCreate' },
        { objs: [dataObject, pageObject, root] },
      ),
    ).to.have.property('var2', pageObject)
  })

  it('should attach the dataObject using a string dataKey', () => {
    expect(
      n.createEmitDataKey('MeetingRoomCreate', {
        objs: [dataObject, pageObject, root],
      }),
    ).to.eq(pageObject)
  })

  it('should attach the dataObject using a string dataKey and its a list consumer', () => {
    expect(
      n.createEmitDataKey('MeetingRoomCreate.hello', {
        component: createComponent({ type: 'view', iteratorVar: 'hello' }),
        objs: [
          dataObject,
          pageObject,
          {
            ...root,
            MeetingRoomCreate: { ...root.MeetingRoomCreate, hello: 'abc' },
          },
        ],
      }),
    ).to.eq('abc')
  })

  it(
    'should strip off the iteratorVar and then proceed to use the key as ' +
      'path if a component list consumer is provided',
    () => {
      expect(
        n.createEmitDataKey(orig, {
          iteratorVar: 'itemObject',
          objs: dataObject,
        }),
      ).to.have.property('var2', 'gender')
      expect(
        n.createEmitDataKey(orig, {
          iteratorVar: 'itemObject',
          objs: [root, pageObject, dataObject],
        }),
      ).to.have.property('var2', 'gender')
    },
  )
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

// describe('findChild', async () => {
//   it('should be able to find nested children', () => {
//     const injectProps = {
//       iteratorVar: 'hello',
//       itemObject: { fruits: ['apple'] },
//       dataKey: 'formData.fruits',
//     }
//     const component = new ListComponent()
//     const child1 = component.createChild('listItem')
//     const childOfChild1 = child1.createChild('view')
//     const childOfChildOfChild1 = childOfChild1.createChild('image')
//     expect(
//       n.findChild(component, (child) => child === childOfChildOfChild1),
//     ).to.equal(childOfChildOfChild1)
//   })

//   it('should be able to find deepy nested children by properties', () => {
//     const component = new ListComponent()
//     const child = component.createChild('listItem')
//     const childOfChild = child.createChild('view')
//     const childOfChildOfChild = childOfChild.createChild('label')
//     const textBoard = childOfChildOfChild.createChild('label')
//     textBoard.set('textBoard', [
//       { text: 'hello' },
//       { br: null },
//       { text: 'my name is christopher' },
//     ])
//     expect(
//       n.findChild(component, (child) => Array.isArray(child.get('textBoard'))),
//     ).to.equal(textBoard)
//   })
// })

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
//     component1 = new ListComponent()
//     component2 = new ListComponent()
//     component3 = new ListComponent()
//     component4 = new ListComponent()
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
