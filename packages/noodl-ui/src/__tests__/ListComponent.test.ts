import _ from 'lodash'
import { expect } from 'chai'
import { mock } from './mockData'
import Component from '../Component'
import ListComponent from '../ListComponent'
import ListItemComponent from '../ListItemComponent'

describe('ListComponent', () => {
  it('should return the list data', () => {
    const args = { iteratorVar: 'colorful' }
    const noodlListComponent = mock.raw.getNOODLList(args)
    const listComponent = new ListComponent(noodlListComponent)
    expect(listComponent.getData()).to.equal(noodlListComponent.listObject)
  })

  it('should return the iteratorVar', () => {
    const args = { iteratorVar: 'colorful' }
    const noodlListComponent = mock.raw.getNOODLList(args)
    const listComponent = new ListComponent(noodlListComponent)
    expect(listComponent.iteratorVar).to.equal(noodlListComponent.iteratorVar)
  })

  it('should update the list data in the state when set is setting a new listObject', () => {
    const newListData = [{ movies: ['rush hour 3', 'space jam'] }]
    const args = { iteratorVar: 'colorful' }
    const noodlListComponent = mock.raw.getNOODLList(args)
    const listComponent = new ListComponent(noodlListComponent)
    expect(listComponent.getData()).not.to.equal(newListData)
    listComponent.set('listObject', newListData)
    expect(listComponent.getData()).to.equal(newListData)
  })

  it('should automatically add type: list if no args', () => {
    const component = new ListComponent()
    expect(component.type).to.equal('list')
    expect(component.noodlType).to.equal('list')
  })

  describe('retrieving dataObjects from list item children', () => {
    it('should be able to retrieve a data object for a list item using the child instance', () => {
      const component = new ListComponent({ iteratorVar: 'apple' })
      const child1 = component.createChild(new ListItemComponent())
      const dataObject = { fruit: 'banana' }
      child1.set(component.iteratorVar, dataObject)
      expect(component.getDataObject(child1)).to.equal(dataObject)
    })

    it('should be able to retrieve a data object for a list item using the child id', () => {
      const component = new ListComponent({ iteratorVar: 'apple' })
      const child1 = component.createChild(new ListItemComponent())
      const dataObject = { fruit: 'banana' }
      child1.set(component.iteratorVar, dataObject)
      expect(component.getDataObject(child1.id)).to.equal(dataObject)
    })

    it('should be able to retrieve a data object for a list item using the index position', () => {
      const component = new ListComponent({ iteratorVar: 'apple' })
      component.createChild(new ListItemComponent())
      const child2 = component.createChild(new ListItemComponent())
      const child3 = component.createChild(new ListItemComponent())
      const dataObject = { fruit: 'banana' }
      child2.set(component.iteratorVar, { ...dataObject })
      child3.set(component.iteratorVar, dataObject)
      expect(component.getDataObject(2)).to.equal(dataObject)
    })

    it('should return dataObjects from list item children', () => {
      const list = new ListComponent({ iteratorVar: 'apple' })
      const listItem1 = list.createChild(new ListItemComponent())
      const listItem2 = list.createChild(new ListItemComponent())
      const listItem3 = list.createChild(new ListItemComponent())
      const dataObjects = {
        '1': { fruits: [] },
        '2': { fruits: ['apple'] },
        '3': { water: 'dasani' },
      }
      list
        .getListItemChildren()
        .forEach((child, index) =>
          child.set('iteratorVar', _.get(dataObjects, `${index}`)),
        )
      const data = list.getData()
      console.info(data)
    })
  })

  it('should add the child to list state only if its a listItem child', () => {
    const component = new ListComponent()
    const child1 = component.createChild(new ListItemComponent())
    const child2 = component.createChild(new Component({ type: 'view' }))
    expect(component.exists(child1)).to.be.true
    expect(component.exists(child2)).to.be.false
  })

  it('should still add the child to the base state if its not a listItem child', () => {
    const component = new ListComponent()
    const child = component.createChild(new Component({ type: 'view' }))
    expect(component.has(child)).to.be.false
    expect(component.child()).to.equal(child)
  })

  describe('family tree', () => {
    it('should be able to reference parent list component instances from children', () => {
      const component = new ListComponent()
      const child1 = component.createChild(new ListItemComponent())
      const child2 = component.createChild(new ListItemComponent())
      expect(child1.parent()).to.equal(component)
      expect(child2.parent()).to.equal(component)
    })
  })

  describe('setting listObject', () => {
    it('should have a data object assign to every child ', () => {
      const listData = mock.other.getNOODLListObject()
      const component = new ListComponent()
      component.set('iteratorVar', 'apple')
      listData.forEach((dataObject) => {
        const child = component.createChild(new ListItemComponent())
        child.set(component.iteratorVar, dataObject)
      })
    })

    xit('should have created list item components for additional data objects', () => {
      //
    })

    xit('should have removed list item components to match the length of the new listObject', () => {
      //
    })

    xit("should refresh all of its children's data object to align the order of the list data", () => {
      //
    })
  })
})
