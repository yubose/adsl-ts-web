import _ from 'lodash'
import sinon from 'sinon'
import Component from '../components/Base/Base'
import ListItemComponent from '../components/ListItem/ListItem'
import List from '../components/List/List'
import { expect } from 'chai'
import { event } from '../constants'
import { forEachDeepChildren } from '../utils/noodl'
import { mock } from './mockData'
import { IComponent } from '../types'

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

  describe('addDataObject', () => {
    it(`should emit ${event.component.list.ADD_DATA_OBJECT} with the correct args`, () => {
      const component = new List()
      const spy = sinon.spy()
      const dataObject = { firstName: 'Mike', lastName: 'Rodriguez' }
      component.on(event.component.list.ADD_DATA_OBJECT, spy)
      component.addDataObject(dataObject)
      const args = spy.firstCall.args[0]
      expect(args).to.have.property('index')
      expect(args).to.have.property('dataObject')
      expect(args).to.have.property('succeeded')
    })
  })

  describe('deleteDataObject', () => {
    it(`should emit ${event.component.list.DELETE_DATA_OBJECT} with the correct args`, () => {
      const component = new List()
      const dataObject = { firstName: 'Mike', lastName: 'Rodriguez' }
      component.addDataObject(dataObject)
      const spy = sinon.spy()
      component.on(event.component.list.DELETE_DATA_OBJECT, spy)
      component.removeDataObject(0)
      const args = spy.firstCall.args[0]
      expect(args).to.have.property('index')
      expect(args).to.have.property('dataObject')
      expect(args).to.have.property('succeeded')
    })
  })

  describe('getDataObject', () => {
    it(`should emit ${event.component.list.RETRIEVE_DATA_OBJECT} with the correct args`, () => {
      const component = new List()
      const dataObject = { firstName: 'Mike', lastName: 'Rodriguez' }
      component.addDataObject(dataObject)
      const spy = sinon.spy()
      component.on(event.component.list.RETRIEVE_DATA_OBJECT, spy)
      component.getDataObject(0)
      const args = spy.firstCall.args[0]
      expect(args).to.have.property('index')
      expect(args).to.have.property('dataObject')
      expect(args).to.have.property('succeeded')
    })
  })

  describe('updateDataObject', () => {
    it(`should emit ${event.component.list.UPDATE_DATA_OBJECT} with the correct args`, () => {
      const component = new List()
      const dataObject = { firstName: 'Mike', lastName: 'Rodriguez' }
      component.addDataObject(dataObject)
      const spy = sinon.spy()
      component.on(event.component.list.UPDATE_DATA_OBJECT, spy)
      component.setDataObject(0, { ...dataObject, email: 'chris@gmail.com' })
      const args = spy.firstCall.args[0]
      expect(args).to.have.property('index')
      expect(args).to.have.property('dataObject')
      expect(args.dataObject).to.have.property('email', 'chris@gmail.com')
      expect(args).to.have.property('succeeded')
    })
  })

  it('should automatically add type: list if no args', () => {
    const component = new List()
    expect(component.type).to.equal('list')
    expect(component.noodlType).to.equal('list')
  })

  // xdescribe('retrieving dataObjects from list item children', () => {
  //   it('should be able to retrieve a data object for a list item using the child instance', () => {
  //     const component = new List({ iteratorVar: 'apple' })
  //     const child1 = component.createChild(new ListItemComponent())
  //     const dataObject = { fruit: 'banana' }
  //     child1.set(component.iteratorVar, dataObject)
  //     expect(component.getDataObject(child1)).to.equal(dataObject)
  //   })

  //   it('should be able to retrieve a data object for a list item using the child id', () => {
  //     const component = new List({ iteratorVar: 'apple' })
  //     const child1 = component.createChild(new ListItemComponent())
  //     const dataObject = { fruit: 'banana' }
  //     child1.set(component.iteratorVar, dataObject)
  //     expect(component.getDataObject(child1.id)).to.equal(dataObject)
  //   })

  //   it('should be able to retrieve a data object for a list item using the index position', () => {
  //     const component = new List({ iteratorVar: 'apple' })
  //     component.createChild(new ListItemComponent())
  //     const child2 = component.createChild(new ListItemComponent())
  //     const child3 = component.createChild(new ListItemComponent())
  //     const dataObject = { fruit: 'banana' }
  //     child2.set(component.iteratorVar, { ...dataObject })
  //     child3.set(component.iteratorVar, dataObject)
  //     expect(component.getDataObject(2)).to.equal(dataObject)
  //   })

  //   it('should return dataObjects from list item children', () => {
  //     const list = new List({ iteratorVar: 'apple' })
  //     const listItem1 = list.createChild(new ListItemComponent())
  //     const listItem2 = list.createChild(new ListItemComponent())
  //     const listItem3 = list.createChild(new ListItemComponent())
  //     const dataObjects = {
  //       '1': { fruits: [] },
  //       '2': { fruits: ['apple'] },
  //       '3': { water: 'dasani' },
  //     }
  //     list
  //       .getListItemChildren()
  //       .forEach((child, index) =>
  //         child.set('iteratorVar', _.get(dataObjects, `${index}`)),
  //       )
  //     const data = list.getData()
  //     console.info(data)
  //   })
  // })

  it('should add the child to list state only if its a listItem child', () => {
    const component = new List()
    const child1 = component.createChild(new ListItemComponent())
    const child2 = component.createChild(new Component({ type: 'view' }))
    expect(component.exists(child1)).to.be.true
    expect(component.exists(child2)).to.be.false
  })

  it('should still add the child to the base state if its not a listItem child', () => {
    const component = new List()
    const child = component.createChild(new Component({ type: 'view' }))
    expect(component.has(child as IComponent)).to.be.false
    expect(component.child()).to.equal(child)
  })
})
