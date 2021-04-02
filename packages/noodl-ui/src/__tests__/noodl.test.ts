import { expect } from 'chai'
import sinon from 'sinon'
import createComponent from '../utils/createComponent'
import Component from '../components/Base'
import * as n from '../utils/noodl'

describe('noodl (utils)', () => {
  it('should call the callback everytime a nested child is encountered', () => {
    const spy = sinon.spy()
    const component = {
      children: [
        {
          // args[0]
          a: true,
          children: [
            {
              //args[1]
              b: true,
              children: [
                {
                  //args[2]
                  c: true,
                  children: [
                    //args[3]
                    { children: { lastChild: true } as any },
                  ],
                  lastChild: false,
                },
              ],
            },
          ],
        },
      ],
    } as any
    n.forEachDeepChildren(component, spy)
    const args = spy.args
    expect(args[0][1]).to.equal(component.children[0])
    expect(args[0][1]).to.have.property('a', true)
    expect(args[1][1]).to.equal(component.children[0].children[0])
    expect(args[2][1]).to.equal(component.children[0].children[0].children[0])
    expect(args[3][1]).to.equal(
      component.children[0].children[0].children[0].children[0],
    )
    expect(args[4][1]).to.equal(
      component.children[0].children[0].children[0].children[0].children,
    )
  })

  describe('findChild', () => {
    it('should be able to find nested children', () => {
      const component = new List() as any
      const child1 = component.createChild(createComponent('listItem'))
      const childOfChild1 = child1.createChild(createComponent('view'))
      const childOfChildOfChild1 = childOfChild1.createChild('image')
      expect(
        n.findChild(component, (child) => child === childOfChildOfChild1),
      ).to.equal(childOfChildOfChild1)
    })

    it('should be able to find deepy nested children by properties', () => {
      const component = new List()
      const child = component.createChild(createComponent('listItem'))
      const childOfChild = child.createChild(createComponent('view'))
      const childOfChildOfChild = childOfChild.createChild(
        createComponent('label'),
      )
      const textBoard = childOfChildOfChild.createChild(
        createComponent('label'),
      )
      textBoard.set('textBoard', [
        { text: 'hello' },
        { br: null },
        { text: 'my name is christopher' },
      ])
      expect(
        n.findChild(component as any, (child) =>
          Array.isArray(child.get('textBoard')),
        ),
      ).to.equal(textBoard)
    })
  })

  describe('findParent', () => {
    it('should be able to find grand parents by traversing up the chain', () => {
      const component = createComponent({ type: 'view', children: [] })
      const child = component.createChild(createComponent('list') as any)
      const childOfChild = child.createChild(createComponent('listItem') as any)
      const childOfChildOfChild = childOfChild.createChild(
        createComponent('image'),
      )
      expect(childOfChildOfChild.parent().parent()).to.equal(child)
      expect(childOfChildOfChild.parent().parent().parent()).to.equal(component)
    })
  })

  describe('findListDataObject', () => {
    let listObject = [
      { fruits: ['apple'], color: 'purple' },
      { fruits: ['banana'], color: 'red' },
    ]
    const iteratorVar = 'hello'
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

    it('should be able to find the dataObject inside listItem', () => {
      const image = createComponent('image')
      listItem.createChild(image)
      list.createChild(listItem)
      listItem.set('listIndex', null)
      expect(n.findListDataObject(image)).not.to.eq(list.getData()[0])
      listItem.setDataObject(list.getData()[0])
      expect(n.findListDataObject(image)).to.eq(list.getData()[0])
    })

    it('should be able to find the dataObject inside list using listIndex', () => {
      const image = createComponent('image')
      listItem.createChild(image)
      list.createChild(listItem)
      listItem.setDataObject(null)
      listItem.set('listIndex', null)
      expect(n.findListDataObject(image)).not.to.eq(list.getData()[0])
      listItem.set('listIndex', 0)
      expect(n.findListDataObject(image)).to.eq(list.getData()[0])
    })
  })

  describe('publish', () => {
    it('should recursively call the callback', () => {
      const spy = sinon.spy()
      const view = createDeepChildren('view', {
        depth: 6,
        injectProps: {
          last: {
            viewTag: 'genderTag',
            style: { border: { style: '2' } },
          },
        },
      })
      n.publish(view, spy)
      expect(spy.callCount).to.eq(6)
      expect(spy.lastCall.args[0].get('viewTag')).to.eq('genderTag')
      expect(spy.lastCall.args[0].style).to.exist
    })
  })
})
