import _ from 'lodash'
import { expect } from 'chai'
import { mock } from './mockData'
import ListComponent from '../ListComponent'
import ListItemComponent from '../ListItemComponent'

describe('ListComponent', () => {
  it('should return the list data', () => {
    const noodlListComponent = mock.raw.getNOODLList({
      iteratorVar: 'colorful',
    })
    const listComponent = new ListComponent(noodlListComponent)
    expect(listComponent.data()).to.equal(noodlListComponent.listObject)
  })

  it('should return the iteratorVar', () => {
    const noodlListComponent = mock.raw.getNOODLList({
      iteratorVar: 'colorful',
    })
    const listComponent = new ListComponent(noodlListComponent)
    expect(listComponent.iteratorVar).to.equal(noodlListComponent.iteratorVar)
  })

  it('should update the list data in the state when set is setting a new listObject', () => {
    const newListData = [{ movies: ['rush hour 3', 'space jam'] }]
    const noodlListComponent = mock.raw.getNOODLList({
      iteratorVar: 'colorful',
    })
    const listComponent = new ListComponent(noodlListComponent)
    expect(listComponent.data()).not.to.equal(newListData)
    listComponent.set('listObject', newListData)
    expect(listComponent.data()).to.equal(newListData)
  })

  it('should automatically add type: list if no args', () => {
    const component = new ListComponent()
    expect(component.type).to.equal('list')
    expect(component.noodlType).to.equal('list')
  })

  it('should be able to reference parent list component instances from children', () => {
    const component = new ListComponent()
    const child1 = component.createChild(new ListItemComponent())
    const child2 = component.createChild(new ListItemComponent())
    expect(child1.parent()).to.equal(component)
    expect(child2.parent()).to.equal(component)
  })

  it('should return all the list data', () => {
    const listData = mock.other.getNOODLListObject()
    const component = new ListComponent()
    component.set('iteratorVar', 'apple')
    listData.forEach((dataObject) => {
      const child = component.createChild(new ListItemComponent())
      child.set(component.iteratorVar, dataObject)
    })
  })

  describe('addListItem', () => {
    describe('passing the child instance to get the list item data from it instead', () => {
      xit('should add the list item data to the data list', () => {
        //
      })

      xit("should add the new child into its children if it doesn't already exist", () => {
        //
      })
    })
  })

  describe('set', () => {
    xit('should set the new list data', () => {
      //
    })

    xit("should refresh all of its children's data object to match the order of the list data", () => {
      //
    })
  })
})
