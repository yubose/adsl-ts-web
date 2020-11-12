import _ from 'lodash'
import path from 'path'
import fs from 'fs-extra'
import sinon from 'sinon'
import { expect } from 'chai'
import { prettyDOM, screen, waitFor } from '@testing-library/dom'
import { event } from '../constants'
import { forEachDeepChildren } from '../utils/noodl'
import { mock } from './mockData'
import { IList, IListItem } from '../types'
import { noodlui, toDOM } from '../utils/test-utils'
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
      const parent = noodlui.resolveComponents({
        type: 'view',
        children: [noodlComponent],
      })
      const listItemComponent = noodlComponent.children[0]
      const component = parent.child() as IList
      const blueprint = component.getBlueprint()
      expect(blueprint.type).to.equal(listItemComponent.type)
      expect(blueprint.contentType).to.equal(listItemComponent.contentType)
      expect(blueprint.style).to.deep.equal(listItemComponent.style)
      expect(blueprint.id).to.deep.equal(listItemComponent.id)
    })

    it('should include the same amount of children as the listitem placeholder component did', () => {
      const noodlComponent = mock.raw.getNOODLList()
      const listItemComponent = noodlComponent.children[0]
      const parent = noodlui.resolveComponents({
        type: 'view',
        children: [noodlComponent],
      })
      const component = parent.child() as IList
      const blueprint = component?.getBlueprint()
      expect(blueprint.children).to.have.lengthOf(
        listItemComponent.children?.length as any,
      )
    })

    it('should have deeply copied its entire tree down', () => {
      const noodlComponent = mock.raw.getNOODLList()
      const parent = noodlui.resolveComponents({
        type: 'view',
        children: [noodlComponent],
      })
      const component = parent.child()
      const listItemComponent = noodlComponent.children[0]
      const blueprint = component.getBlueprint()
      const [label1, label2, label3, view, button] = blueprint.children as any
      expect(label1.noodlType).to.eq(listItemComponent.children?.[0].type)
      expect(label1.text).to.eq(listItemComponent.children?.[0].text)
      expect(label1.dataKey).to.eq(listItemComponent.children?.[0].dataKey)
      // expect(label1.style).to.deep.eq(listItemComponent.children?.[0].style)
      expect(label2.noodlType).to.eq(listItemComponent.children?.[1].type)
      expect(label2.text).to.eq(listItemComponent.children?.[1].text)
      expect(label2.dataKey).to.eq(listItemComponent.children?.[1].dataKey)
      // expect(label2.style).to.deep.eq(listItemComponent.children?.[1].style)
      expect(label3.noodlType).to.eq(listItemComponent.children?.[2].type)
      expect(label3.text).to.eq(listItemComponent.children?.[2].text)
      expect(label3.dataKey).to.eq(listItemComponent.children?.[2].dataKey)
      // expect(label3.style).to.deep.eq(listItemComponent.children?.[2].style)
      expect(view.noodlType).to.eq(listItemComponent.children?.[3].type)
      expect(view.viewTag).to.eq(listItemComponent.children?.[3].viewTag)
      expect(view.required).to.eq(listItemComponent.children?.[3].required)
      // expect(view.style).to.deep.eq(listItemComponent.children?.[3].style)
      expect(view.children).to.have.lengthOf(1)
      expect(view.children[0].noodlType).to.eq('view')
      expect(view.children[0].children[0].noodlType).to.eq('view')
      expect(view.children[0].children[0].children[0].noodlType).to.eq('view')
      expect(view.children[0].children[0].children[0].listId).to.eq(
        component.listId,
      )
      // expect(view.children[0].children[0].children[0].style).to.deep.eq(
      //   listItemComponent?.children?.[3]?.children?.[0]?.children?.[0]
      //     ?.children?.[0]?.style,
      // )
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
      component.updateDataObject(0, { ...dataObject, email: 'chris@gmail.com' })
      expect(spy.called).to.be.true
    })

    it('should update the listItem', () => {
      const component = noodlui.resolveComponents({
        type: 'list',
        iteratorVar: 'f',
        listObject: [{ fruits: ['apple'] }],
        children: [{ type: 'listItem' }],
      })
    })
  })

  it('should automatically add type: list if no args', () => {
    const component = new List()
    expect(component.type).to.equal('list')
    expect(component.noodlType).to.equal('list')
  })

  xdescribe('when no children was passed in the noodl component object', () => {
    //
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

  describe('when working with the DOM', () => {
    it('should start with no children if listObject is empty', () => {
      const { component, node } = toDOM({
        type: 'list',
        listObject: [],
        iteratorVar: 'hello',
        children: [{ type: 'listItem' }],
      })
      expect(component.children).to.have.lengthOf(0)
      expect(node.children).to.have.lengthOf(0)
    })

    it('should allow the client side to react with adding data objects', () => {
      const { component: parent, node } = toDOM({
        type: 'view',
        children: [
          {
            type: 'list',
            listObject: [
              { fruits: ['apple'] },
              { fruits: ['banana'] },
              { fruits: ['orange'] },
            ],
            iteratorVar: 'hello',
            children: [{ type: 'listItem' }],
          },
        ],
      })

      const component = parent.child()
      const ul = document.createElement('ul')
      node.appendChild(ul)

      _.forEach(component.children(), (c) => {
        const li = document.createElement('li')
        li.textContent += c.getDataObject?.()?.fruits[0]
        ul.appendChild(li)
      })

      component.on(event.component.list.CREATE_LIST_ITEM, (result) => {
        const { listItem } = result
        const li = document.createElement('li')
        li.innerHTML += listItem.getDataObject()?.fruits[0]
        ul.appendChild(li)
      })

      const listElem = document.querySelector('ul')
      expect(listElem?.childNodes).to.have.lengthOf(3)
      component?.addDataObject({ fruits: ['pear'] })
      expect(listElem?.childNodes).to.have.lengthOf(4)
      expect(listElem?.childNodes[0].textContent).to.equal('apple')
      expect(listElem?.childNodes[1].textContent).to.equal('banana')
      expect(listElem?.childNodes[2].textContent).to.equal('orange')
      expect(listElem?.childNodes[3].textContent).to.equal('pear')
    })

    it(
      'should be able to use the api to allow us to remove the corresponding ' +
        'list item node if its dataObject was removed',
      () => {
        const { component: parent, node } = toDOM({
          type: 'view',
          children: [
            {
              type: 'list',
              listObject: [
                { fruits: ['apple'] },
                { fruits: ['banana'] },
                { fruits: ['orange'] },
              ],
              iteratorVar: 'hello',
              children: [{ type: 'listItem' }],
            },
          ],
        })

        const component = parent.child()

        _.forEach(component.children(), (c) => {
          const li = document.createElement('li')
          li.id = c.id
          li.textContent += c.getDataObject()?.fruits[0]
          node.appendChild(li)
        })

        component.on(event.component.list.REMOVE_LIST_ITEM, (result) => {
          const { listItem } = result
          const li = document.getElementById(listItem.id) as HTMLLIElement
          node.removeChild(li)
        })

        const listItemElems = document.querySelectorAll('li')
        component?.removeDataObject(1)
        expect(listItemElems).to.have.lengthOf(3)
      },
    )

    xit('should update the corresponding list item node that is referencing the dataObject', () => {
      const { component, node } = toDOM({
        type: 'list',
        listObject: [
          { fruits: ['apple'] },
          { fruits: ['banana'] },
          { fruits: ['orange'] },
        ],
        iteratorVar: 'hello',
        children: [{ type: 'listItem' }],
      })

      _.forEach(component.children(), (c: IListItem) => {
        const li = document.createElement('li')
        li.id = c.id
        li.textContent += c.getDataObject().fruits[0]
        node.appendChild(li)
      })

      component.on(event.component.list.UPDATE_LIST_ITEM, (result) => {
        const { listItem } = result
        const li = document.getElementById(listItem.id) as HTMLLIElement
        li.innerHTML = listItem.getDataObject().fruits[0]()()()
      })

      const listElems = document.querySelector('ul')
      expect(listElems?.children[1].innerHTML).to.equal('banana')
      component.updateDataObject(2, { fruits: ['grape'] })
      expect(listElems?.children[1].innerHTML).to.equal('grape')
    })

    xdescribe('redraw', () => {
      it(
        'should allow us to update all descendants in the DOM from the ' +
          'changed listItem components',
        () => {
          noodlui
            .setRoot('SignIn', { formData: { greeting: 'hello!' } })
            .setPage('SignIn')
          const { component, node } = toDOM({
            type: 'list',
            listObject: [
              { fruits: ['apple'] },
              { fruits: ['banana'] },
              { fruits: ['orange'] },
            ],
            iteratorVar: 'hello',
            children: [
              {
                type: 'listItem',
                children: [
                  {
                    type: 'view',
                    children: [{ type: 'label', dataKey: 'formData.greeting' }],
                  },
                ],
              },
            ],
          })

          _.forEach(component.children(), (c) => {
            const li = document.createElement('li')
            li.id = c.id
            li.textContent += c.getDataObject().fruits[0]
            node.appendChild(li)
          })
        },
      )
    })
  })
})
