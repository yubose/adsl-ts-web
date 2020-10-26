import { expect } from 'chai'
import {
  Component,
  ListComponent,
  ListItemComponent,
  IComponent,
  IListComponent,
  IListItemComponent,
} from 'noodl-ui'
import * as n from '.'

describe('isAction', () => {
  it('should return true', () => {
    expect(n.isAction({ actionType: 'hello' })).to.be.true
  })
  it('should return false', () => {
    expect(n.isAction({ actiondasType: 'hello' })).to.be.false
  })
  it('should return true', () => {
    expect(n.isAction({ goto: 'abc' })).to.be.true
  })
  it('should return false', () => {
    expect(n.isAction('goto')).to.be.false
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

describe('findList', () => {
  let component1: IListComponent
  let component2: IListComponent
  let component3: IListComponent
  let component4: IListComponent
  let component2Child: IComponent
  let component2ChildChild: IComponent
  let component2ChildChildChild: IComponent

  let data = [{ fruits: ['apple', 'banana'] }, { fruits: ['orange'] }]
  let mapOfLists: Map<IListComponent, IListComponent>

  beforeEach(() => {
    component1 = new ListComponent()
    component2 = new ListComponent()
    component3 = new ListComponent()
    component4 = new ListComponent()
    component1.createChild('date')
    component2Child = component2.createChild('listItem')
    component2ChildChild = component2Child.createChild('view')
    component2ChildChildChild = component2ChildChild.createChild('label')
    component3.createChild('select')
    component4.createChild('scrollView')
    component2.set('listObject', data)
    component3.set('listObject', ['hello?'])

    mapOfLists = new Map([
      [component1, component1],
      [component2, component2],
      [component3, component3],
      [component4, component4],
    ])
  })

  it("should be able to return the list by using a list component's id", () => {
    expect(n.findList(mapOfLists, component2.id)).to.equal(data)
  })

  it('should be able to return the list by directly using a list component instance', () => {
    //
  })

  xit("should be able to return the list by using a list item component's id", () => {
    //
  })

  xit('should be able to return the list by directly using a list item component instance', () => {
    //
  })

  xit("should be able to return the list by using a normal component's component id", () => {
    //
  })

  xit("should be able to return the list by using a normal component's instance", () => {
    //
  })
})
