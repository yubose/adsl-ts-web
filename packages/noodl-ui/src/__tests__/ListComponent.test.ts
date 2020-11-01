import _ from 'lodash'
import { expect } from 'chai'
import { mock } from './mockData'
import Component from '../components/Base/Base'
import ListComponent from '../components/List/List'
import ListItemComponent from '../components/ListItem/ListItem'
import { ComponentType, IList, NOODLComponent } from '../types'

function generateListComponent(noodlComponent: ComponentType) {
  return new ListComponent(noodlComponent) as IList
}

describe('ListComponent', () => {
  describe('initiation', () => {
    it('should set the list object data', () => {
      const args = { iteratorVar: 'colorful', listObject: ['fruits'] }
      const noodlComponent = mock.raw.getNOODLList(args)
      const component = generateListComponent(noodlComponent)
      expect(component.getData()).to.equal(args.listObject)
    })

    it('should set the iteratorVar', () => {
      const noodlComponent = mock.raw.getNOODLList({ iteratorVar: 'colorful' })
      const component = generateListComponent(noodlComponent)
      expect(component.iteratorVar).to.equal(noodlComponent.iteratorVar)
    })
  })

  describe('behavior', () => {
    xit('should update the blueprint when setting new list data', () => {
      const mergingArgs = { style: { border: '1px solid red' } }
      const newListObject = [{ fruits: ['apples'], vegetables: ['tomatoes'] }]
      const noodlComponent = mock.raw.getNOODLList({ iteratorVar: 'colorful' })
      const component = generateListComponent(noodlComponent)
      component.on('blueprint', ({ merge }) => {
        merge(mergingArgs)
      })
      component.set('listObject', newListObject)
      // expect(component.)
    })

    xit('', () => {
      const noodlComponent = mock.raw.getNOODLList({ iteratorVar: 'colorful' })
      const component = generateListComponent(noodlComponent)
      component.on('data', (args) => {
        //
      })
    })

    xit('', () => {
      const noodlComponent = mock.raw.getNOODLList({ iteratorVar: 'colorful' })
      const component = generateListComponent(noodlComponent)
      component.on('update', (args) => {
        //
      })
    })
  })

  xit('should return the list data (from nodes)', () => {
    const args = { iteratorVar: 'colorful' }
    const noodlComponent = mock.raw.getNOODLList(args)
    const listObject = noodlComponent.listObject
    const listComponent = new ListComponent(noodlComponent)
    listObject.forEach((item: any) =>
      listComponent
        .createChild('listItem')
        ?.set(listComponent.iteratorVar, item),
    )
    const data = listComponent.getData({ fromNodes: true })
    expect(data).to.deep.equal(listObject)
  })

  xit('should return the iteratorVar', () => {
    const args = { iteratorVar: 'colorful' }
    const noodlComponent = mock.raw.getNOODLList(args)
    const listComponent = new ListComponent(noodlComponent)
    expect(listComponent.iteratorVar).to.equal(noodlComponent.iteratorVar)
  })

  xit('should update the list data in the state when set is setting a new listObject', () => {
    const newListData = [{ movies: ['rush hour 3', 'space jam'] }]
    const args = { iteratorVar: 'colorful' }
    const noodlComponent = mock.raw.getNOODLList(args)
    const listComponent = new ListComponent(noodlComponent)
    expect(listComponent.getData()).not.to.equal(newListData)
    listComponent.set('listObject', newListData)
    expect(listComponent.getData()).to.equal(newListData)
  })

  xit('should automatically add type: list if no args', () => {
    const component = new ListComponent()
    expect(component.type).to.equal('list')
    expect(component.noodlType).to.equal('list')
  })

  xdescribe('blueprint', () => {
    xit('should allow us to set the next blueprint and update the list item nodes', () => {
      const component = new ListComponent({
        iteratorVar: 'apple',
        listObject: [{ age: 18 }, { age: 28 }, { age: 8 }],
      })
      const listItem1 = component.createChild('listItem')
      const listItem2 = component.createChild('listItem')
    })
  })

  xdescribe('retrieving dataObjects from list item children', () => {
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

  xit('should add the child to list state only if its a listItem child', () => {
    const component = new ListComponent()
    const child1 = component.createChild(new ListItemComponent())
    const child2 = component.createChild(new Component({ type: 'view' }))
    expect(component.exists(child1)).to.be.true
    expect(component.exists(child2)).to.be.false
  })

  xit('should still add the child to the base state if its not a listItem child', () => {
    const component = new ListComponent()
    const child = component.createChild(new Component({ type: 'view' }))
    expect(component.has(child)).to.be.false
    expect(component.child()).to.equal(child)
  })

  xdescribe('family tree', () => {
    it('should be able to reference parent list component instances from children', () => {
      const component = new ListComponent()
      const child1 = component.createChild(new ListItemComponent())
      const child2 = component.createChild(new ListItemComponent())
      expect(child1.parent()).to.equal(component)
      expect(child2.parent()).to.equal(component)
    })
  })

  xdescribe('setting listObject', () => {
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
