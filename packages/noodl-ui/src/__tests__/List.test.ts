import _ from 'lodash'
import sinon from 'sinon'
import { expect } from 'chai'
import { event } from '../constants'
import { forEachDeepChildren } from '../utils/noodl'
import { mock } from './mockData'
import { IComponent } from '../types'
import Component from '../components/Base'
import ListItemComponent from '../components/ListItem'
import List from '../components/List'

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
    it(`should emit ${event.component.list.ADD_DATA_OBJECT}`, () => {
      const component = new List()
      const spy = sinon.spy()
      const dataObject = { firstName: 'Mike', lastName: 'Rodriguez' }
      component.on(event.component.list.ADD_DATA_OBJECT, spy)
      component.addDataObject(dataObject)
      expect(spy.called).to.be.true
    })
  })

  describe('getDataObject', () => {
    it(`should emit ${event.component.list.RETRIEVE_DATA_OBJECT}`, () => {
      const component = new List()
      const dataObject = { firstName: 'Mike', lastName: 'Rodriguez' }
      const spy = sinon.spy()
      component.on(event.component.list.RETRIEVE_DATA_OBJECT, spy)
      component.addDataObject(dataObject)
      component.getDataObject(0)
      expect(spy.called).to.be.true
    })
  })

  describe('removeDataObject', () => {
    it(`should emit ${event.component.list.DELETE_DATA_OBJECT}`, () => {
      const component = new List({ type: 'list', listObject: [] })
      const dataObject = { firstName: 'Mike', lastName: 'Rodriguez' }
      const spy = sinon.spy()
      component.on(event.component.list.DELETE_DATA_OBJECT, spy)
      component.addDataObject(dataObject)
      component.removeDataObject(0)
      expect(spy.called).to.be.true
    })
  })

  describe('updateDataObject', () => {
    it(`should emit ${event.component.list.UPDATE_DATA_OBJECT}`, () => {
      const component = new List()
      const dataObject = { firstName: 'Mike', lastName: 'Rodriguez' }
      component.addDataObject(dataObject)
      const spy = sinon.spy()
      component.on(event.component.list.UPDATE_DATA_OBJECT, spy)
      component.setDataObject(0, { ...dataObject, email: 'chris@gmail.com' })
      expect(spy.called).to.be.true
    })
  })

  it('should automatically add type: list if no args', () => {
    const component = new List()
    expect(component.type).to.equal('list')
    expect(component.noodlType).to.equal('list')
  })

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
