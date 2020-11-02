import _ from 'lodash'
import chalk from 'chalk'
import { expect } from 'chai'
import { forEachDeepChildren } from '../utils/noodl'
import { mock } from './mockData'
import Component from '../components/Base/Base'
import ListItemComponent from '../components/ListItem/ListItem'
import List from '../components/List/List'
import { IComponentType, IList, NOODLComponent } from '../types'

function generateListComponent(noodlComponent: IComponentType) {
  return new List(noodlComponent) as IList
}

describe('List', () => {
  describe('initiation', () => {
    it('should have initiated the listId, listObject and iteratorVar', () => {
      const args = { iteratorVar: 'colorful', listObject: ['fruits'] }
      const noodlComponent = mock.raw.getNOODLList(args)
      const component = new List(noodlComponent)
      expect(component.listId).to.exist
      expect(component.iteratorVar).to.equal(args.iteratorVar)
      expect(component.getData()).to.equal(args.listObject)
    })

    it('should have initiated the blueprint using the raw noodl list item component', () => {
      const noodlComponent = mock.raw.getNOODLList()
      const { iteratorVar } = noodlComponent
      const component = new List(noodlComponent)
      const blueprint = component.getBlueprint()
      expect(blueprint).to.have.property('listId', component.listId)
      expect(blueprint).to.have.property('iteratorVar', iteratorVar)
    })
  })

  describe('blueprint', () => {
    it('should attach listId and iteratorVar deeply to all children in its family tree', () => {
      const noodlComponent = mock.raw.getNOODLList()
      const component = new List(noodlComponent)
      const blueprint = component.getBlueprint()
      let count = 0
      const encounters = [] as any[]
      forEachDeepChildren(blueprint, (child) => {
        expect(child.listId).to.equal(component.listId)
        count++
        encounters.push(child)
      })
      expect(encounters.length).to.equal(count)
      _.forEach(encounters as any, (enc) => {
        expect(enc.listId).to.equal(blueprint.listId)
      })
    })
  })

  it('should automatically add type: list if no args', () => {
    const component = new List()
    expect(component.type).to.equal('list')
    expect(component.noodlType).to.equal('list')
  })

  xdescribe('retrieving dataObjects from list item children', () => {
    it('should be able to retrieve a data object for a list item using the child instance', () => {
      const component = new List({ iteratorVar: 'apple' })
      const child1 = component.createChild(new ListItemComponent())
      const dataObject = { fruit: 'banana' }
      child1.set(component.iteratorVar, dataObject)
      expect(component.getDataObject(child1)).to.equal(dataObject)
    })

    it('should be able to retrieve a data object for a list item using the child id', () => {
      const component = new List({ iteratorVar: 'apple' })
      const child1 = component.createChild(new ListItemComponent())
      const dataObject = { fruit: 'banana' }
      child1.set(component.iteratorVar, dataObject)
      expect(component.getDataObject(child1.id)).to.equal(dataObject)
    })

    it('should be able to retrieve a data object for a list item using the index position', () => {
      const component = new List({ iteratorVar: 'apple' })
      component.createChild(new ListItemComponent())
      const child2 = component.createChild(new ListItemComponent())
      const child3 = component.createChild(new ListItemComponent())
      const dataObject = { fruit: 'banana' }
      child2.set(component.iteratorVar, { ...dataObject })
      child3.set(component.iteratorVar, dataObject)
      expect(component.getDataObject(2)).to.equal(dataObject)
    })

    it('should return dataObjects from list item children', () => {
      const list = new List({ iteratorVar: 'apple' })
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

  xit('should add the child to list state only if its a listItem child', () => {
    const component = new List()
    const child1 = component.createChild(new ListItemComponent())
    const child2 = component.createChild(new Component({ type: 'view' }))
    expect(component.exists(child1)).to.be.true
    expect(component.exists(child2)).to.be.false
  })

  xit('should still add the child to the base state if its not a listItem child', () => {
    const component = new List()
    const child = component.createChild(new Component({ type: 'view' }))
    expect(component.has(child)).to.be.false
    expect(component.child()).to.equal(child)
  })

  xdescribe('setting listObject', () => {
    it('should have a data object assign to every child ', () => {
      const listData = mock.other.getNOODLListObject()
      const component = new List()
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
