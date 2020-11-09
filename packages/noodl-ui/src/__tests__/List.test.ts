import _ from 'lodash'
import sinon from 'sinon'
import { expect } from 'chai'
import { event } from '../constants'
import { forEachDeepChildren } from '../utils/noodl'
import { mock } from './mockData'
import { IListItem } from 'types'
import List from '../components/List'

describe('List', () => {
  describe('when instantiating', () => {
    it('should have initiated the listId, listObject and iteratorVar', () => {
      const args = { iteratorVar: 'colorful', listObject: ['fruits'] }
      const noodlComponent = mock.raw.getNOODLList(args)
      const component = new List(noodlComponent)
      expect(component.listId).to.exist
      expect(component.iteratorVar).to.equal(args.iteratorVar)
      expect(component.getData()).to.deep.equal(args.listObject)
    })

    it('should have initiated the blueprint using the raw noodl list item component', () => {
      const noodlComponent = mock.raw.getNOODLList()
      const { iteratorVar } = noodlComponent
      const component = new List(noodlComponent)
      const blueprint = component.getBlueprint()
      expect(blueprint).to.have.property('listId', component.listId)
      expect(blueprint).to.have.property('iteratorVar', iteratorVar)
    })

    it('should have assigned the listIndex values accurately', () => {
      const noodlComponent = mock.raw.getNOODLList()
      const component = new List(noodlComponent)
      component
        .children()
        .forEach((child: IListItem, index) =>
          expect(child.listIndex).to.equal(index + 122),
        )
    })
  })

  describe('when putting the blueprint together', () => {
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

    it('should definitely copy the type, contentType, style, and listId properties over from the list item placeholder', () => {
      const noodlComponent = mock.raw.getNOODLList()
      const listItemComponent = noodlComponent.children[0]
      const component = new List(noodlComponent)
      const blueprint = component.getBlueprint()
      expect(blueprint.type).to.equal(listItemComponent.type)
      expect(blueprint.contentType).to.equal(listItemComponent.contentType)
      expect(blueprint.style).to.deep.equal(listItemComponent.style)
      expect(blueprint.id).to.deep.equal(listItemComponent.id)
    })

    it('should include the same amount of children as the listitem placeholder component did', () => {
      const noodlComponent = mock.raw.getNOODLList()
      const listItemComponent = noodlComponent.children[0]
      const component = new List(noodlComponent)
      const blueprint = component.getBlueprint()
      expect(blueprint.children).to.have.lengthOf(
        listItemComponent.children?.length as any,
      )
    })

    it('should have deeply copied its entire tree down', () => {
      const noodlComponent = mock.raw.getNOODLList()
      const component = new List(noodlComponent)
      const listItemComponent = noodlComponent.children[0]
      const blueprint = component.getBlueprint()
      const [label1, label2, label3, view, button] = blueprint.children as any
      expect(label1.type).to.eq(listItemComponent.children?.[0].type)
      expect(label1.text).to.eq(listItemComponent.children?.[0].text)
      expect(label1.dataKey).to.eq(listItemComponent.children?.[0].dataKey)
      expect(label1.style).to.deep.eq(listItemComponent.children?.[0].style)
      expect(label2.type).to.eq(listItemComponent.children?.[1].type)
      expect(label2.text).to.eq(listItemComponent.children?.[1].text)
      expect(label2.dataKey).to.eq(listItemComponent.children?.[1].dataKey)
      expect(label2.style).to.deep.eq(listItemComponent.children?.[1].style)
      expect(label3.type).to.eq(listItemComponent.children?.[2].type)
      expect(label3.text).to.eq(listItemComponent.children?.[2].text)
      expect(label3.dataKey).to.eq(listItemComponent.children?.[2].dataKey)
      expect(label3.style).to.deep.eq(listItemComponent.children?.[2].style)
      expect(view.type).to.eq(listItemComponent.children?.[3].type)
      expect(view.viewTag).to.eq(listItemComponent.children?.[3].viewTag)
      expect(view.required).to.eq(listItemComponent.children?.[3].required)
      expect(view.style).to.deep.eq(listItemComponent.children?.[3].style)
      expect(view.children).to.have.lengthOf(1)
      expect(view.children[0].type).to.eq('view')
      expect(view.children[0].children[0].type).to.eq('view')
      expect(view.children[0].children[0].children[0].type).to.eq('view')
      expect(view.children[0].children[0].children[0].listId).to.eq(
        component.listId,
      )
      expect(view.children[0].children[0].children[0].style).to.deep.eq(
        listItemComponent?.children?.[3]?.children?.[0]?.children?.[0]
          ?.children?.[0]?.style,
      )
    })
  })

  describe('when adding data objects', () => {
    it(`should emit ${event.component.list.ADD_DATA_OBJECT}`, () => {
      const component = new List()
      const spy = sinon.spy()
      const dataObject = { firstName: 'Mike', lastName: 'Rodriguez' }
      component.on(event.component.list.ADD_DATA_OBJECT, spy)
      component.addDataObject(dataObject)
      expect(spy.called).to.be.true
    })
  })

  describe('when retrieving data objects', () => {
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

  describe('when removing data objects', () => {
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

  describe('when updating data objects', () => {
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

  describe('when creating list item children', () => {
    xit('should assign listIndex values accurately', () => {
      const noodlComponent = mock.raw.getNOODLList()
      const component = new List(noodlComponent)
      // const child1 = component.createChild(createChild('listItem') as any)
      // const child2 = component.createChild(createChild('listItem') as any)
      // const child3 = component.createChild(createChild('listItem') as any)
      // expect(child1.listIndex).to.eq(0)
      // expect(child2.listIndex).to.eq(1)
      // expect(child3.listIndex).to.eq(2)
    })
  })
})
