import { expect } from 'chai'
import { createComponent, Component, List, ListItem } from 'noodl-ui'
import * as n from '.'

let listObject: { key: 'gender'; value: 'Male' | 'Female' | 'Other' }[]
let list: List
let view: Component

beforeEach(() => {
  listObject = [
    { key: 'gender', value: 'Male' },
    { key: 'gender', value: 'Female' },
    { key: 'gender', value: 'Other' },
  ]
  view = createComponent('view')
  view.createChild(list as any)
  list = createComponent({
    type: 'list',
    iteratorVar: 'hello',
    listObject,
  }) as any
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
      list = createComponent(noodlList) as any
      listItem = createComponent(noodlListItem) as any
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
      xit('should return the data object by providing a list consumer component', () => {
        list.createChild(listItem as any)
        listItem.createChild(label1)
        listItem.createChild(label2)
        listItem.setDataObject(pageObject.hello)
        // expect(n.findListDataObject(label1)).to.eq(listItem.getDataObject())
      })
    })

    xdescribe('when the data object is not in the listItem instance', () => {
      it(
        'should look for the data object in the list instance using the ' +
          'listIndex if available',
        () => {
          list.createChild(listItem as any)
          list.set('listObject', listObject)
          listItem.createChild(label1)
          listItem.createChild(label2)
          // listItem.createChild(
          //   n.createDeepChildren(
          //     createComponent({ type: 'view', listId, listIndex: 0 }),
          //     {
          //       depth: 8,
          //       injectProps: {
          //         last: () => ({
          //           type: 'label',
          //           iteratorVar: noodlList.iteratorVar,
          //           listId,
          //           dataKey: `${iteratorVar}.fruits`,
          //         }),
          //       },
          //     },
          //   ),
          // )
          label1.set('iteratorVar', list.iteratorVar)
          const child3 = listItem.child(2)
          console.info(child3.toJS())
          // expect(n.findListDataObject(label1)).to.eq(listObject[0])
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
