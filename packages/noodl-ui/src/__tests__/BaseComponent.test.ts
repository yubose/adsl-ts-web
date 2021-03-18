import sinon from 'sinon'
import { expect } from 'chai'
import { IComponent } from '../types'
import Component from '../components/Base'
import createComponent from '../utils/createComponent'

let component: IComponent

beforeEach(() => {
  component = new Component({
    type: 'view',
    viewTag: 'subStream',
    required: 'false',
    style: {
      borderRadius: '5',
      border: {
        style: '5',
      },
      fontStyle: 'bold',
      left: '0.015',
    },
  }) as IComponent
})

describe('BaseComponent', () => {
  describe('when instantiating', () => {
    xit('should convert any immer draft objects to their original form', () => {
      const component = new Component({
        type: 'view',
        onClick: [
          { actionType: 'pageJump', destination: 'hello' },
          { actionType: 'evalObject', object: () => {} },
        ],
        path: {
          emit: {
            dataKey: { var1: 'itemObject' },
            actions: [{ if: [function () {}, {}, {}] }],
          },
        },
        style: {
          border: { style: '2' },
        },
      })
    })
  })

  describe('when working with styles', () => {
    it('should be able to retrieve styles', () => {
      const component = new Component({ type: 'view' })
      component.setStyle('fontSize', '25px')
      expect(component.getStyle('fontSize')).to.equal('25px')
    })

    it('should be able to check if some style exists', () => {
      const component = new Component({ type: 'view' })
      component.setStyle('border', { style: '5' })
      expect(component.getStyle('border')).to.deep.eq({ style: '5' })
    })

    it('should be able to remove styles', () => {
      const component = new Component({
        type: 'view',
        style: { border: { style: '2' } },
      })
      component.removeStyle('border')
      expect(component.hasStyle('border')).to.be.false
    })

    it('should be able to assign styles into the style obj', () => {
      const component = new Component({ type: 'view' })
      const incomingStyles = { borderWidth: '12px', textColor: '#ffffff' }
      expect(component.getStyle('borderWidth')).to.be.undefined
      expect(component.getStyle('textColor')).to.be.undefined
      component.assign('style', incomingStyles)
      expect(component.getStyle('borderWidth')).to.equal('12px')
      expect(component.getStyle('textColor')).to.equal('#ffffff')
      component.removeStyle('borderWidth')
      component.removeStyle('textColor')
      expect(component.getStyle('borderWidth')).to.be.undefined
      expect(component.getStyle('textColor')).to.be.undefined
      component.assignStyles(incomingStyles)
      expect(component.getStyle('borderWidth')).to.equal('12px')
      expect(component.getStyle('textColor')).to.equal('#ffffff')
    })
  })

  describe('status updates', () => {
    it('should start with "drafting" when constructed', () => {
      const component = new Component({ type: 'view' })
      expect(component.status).to.eq('drafting')
    })

    it('should switch between "drafting" and "idle" when calling draft() and done()', () => {
      const component = new Component({ type: 'view' })
      component.done()
      expect(component.status).to.eq('idle')
      component.draft()
      expect(component.status).to.eq('drafting')
      component.done()
    })
  })

  it('should start with an ID', () => {
    const component = new Component({ type: 'view' })
    expect(!!component.id).to.be.true
  })

  describe('when working with children', () => {
    beforeEach(() => {
      component.id = 'abc123'
      component.createChild(
        createComponent({
          type: 'button',
          text: 'hello',
          style: { width: '0.2', height: '0.2' },
        }),
      )
      component.createChild(
        createComponent({
          type: 'textField',
          contentType: 'text',
          placeholder: 'Please type the title here',
          dataKey: 'newRoomInfo.edge.name.roomName',
          style: {
            left: '0',
            top: '0.13',
            width: '0.89333',
            height: '0.05',
            color: '0x00000088',
          },
        }),
      )
    })

    it('should create a child using an instance', () => {
      const component = createComponent({ type: 'list' })
      expect(component.child()).to.be.undefined
      const child = createComponent({ type: 'view' })
      component.createChild(child)
      expect(component.children).to.have.lengthOf(1)
      expect(component.child()).to.equal(child)
    })

    it('should create a child using an object', () => {
      const component = createComponent({ type: 'list', id: 'abc' })
      expect(component.child()).to.be.undefined
      const child = createComponent({ type: 'view' })
      component.createChild(child)
      expect(component.child().id).to.exist
    })

    it('should create a child using a noodl component type', () => {
      const component = new Component({ type: 'label' })
      expect(component.child()).to.be.undefined
      const noodlType = 'label'
      const child = component.createChild(noodlType)
      expect(component.child()).to.equal(child)
    })

    describe('removing', () => {
      it('should remove the child by instance', () => {
        const component = new Component({ type: 'label' })
        const child = component.createChild(createComponent('list'))
        component.createChild(child)
        expect(component.child()).to.equal(child)
        component.removeChild(child)
        expect(component.child()).to.not.equal(child)
      })

      it('should remove the child by index', () => {
        const component = new Component({ type: 'label' })
        component.createChild(createComponent('button'))
        const child2 = component.createChild(createComponent('view'))
        const children = component.children
        const index = 1
        expect(children[index]).to.equal(child2)
        component.removeChild(index)
        expect(component.children.includes(child2)).to.be.false
      })
    })

    xit('should assign a suffix to children with index accessor format in zero indexed ascending order', () => {
      const child1 = createComponent({ type: 'button' })
      const child2 = createComponent({ type: 'textField' })
      const child3 = createComponent({ type: 'textField' })
      const child4 = createComponent({ type: 'textField' })
      component = createComponent({
        type: 'view',
        viewTag: 'subStream',
        required: 'false',
      })
      component.createChild(child1)
      component.createChild(child2)
      component.createChild(child3)
      component.createChild(child4)
      expect(component?.child?.()?.id.endsWith('[0]')).to.be.true
    })

    it('should set the noodlType on instantiation', () => {
      expect(component.noodlType).to.equal(component.type)
    })

    it('"done" should not continue its code if the status property is not "drafting"', () => {
      const spy = sinon.spy()
      component.on('resolved', spy)
      component.done()
      expect(spy.getCalls()).to.have.lengthOf(1)
      component.done()
      expect(spy.getCalls()).to.have.lengthOf(1)
    })

    it('should return all of its children', () => {
      expect(component.children).to.have.lengthOf(2)
    })

    xit('should prefix the ids of their children with its own component id', () => {
      ;(component.children as IComponent[]).forEach((child) => {
        expect(child.id.startsWith(component.id)).to.be.true
      })
    })

    it('should allow children to get access to this instance', () => {
      const children = component.children as IComponent[]
      children.forEach((child) => {
        expect(child.parent()).to.equal(component)
      })
    })

    it('should be able to walk down the children hierarchy', () => {
      const nestedChild = createComponent({
        type: 'view',
        style: { border: { style: '2' } },
        dataKey: 'hello.bro',
      })
      const nestedChildChild = createComponent({
        type: 'button',
        path: 'sfasfsaasfas.png',
        style: {},
      })
      const nestedChildChild2 = createComponent({
        type: 'label',
        style: {},
      })
      component.child(1)?.createChild?.(nestedChild)
      nestedChild?.createChild(nestedChildChild)
      nestedChild?.createChild(nestedChildChild2)
      expect(component.child(1)?.child(0)).to.equal(nestedChild)
      expect(component.child(1)?.child()?.child(0)).to.equal(nestedChildChild)
      expect(component.child(1)?.child()?.child(1)).to.equal(nestedChildChild2)
    })

    it('should remove the first child if args is empty', () => {
      const firstChild = component.child(0)
      expect(component).to.have.lengthOf(2)
      component.removeChild()
      expect(component).to.have.lengthOf(1)
      expect(component.child()).to.not.equal(firstChild)
    })

    it('should be able to remove a child by index', () => {
      const firstChild = component.child(0)
      component.removeChild(1)
      expect(component).to.have.lengthOf(1)
      expect(component.child()).to.equal(firstChild)
      component.removeChild(0)
      expect(component.child()).to.be.undefined
    })

    it('should be able to remove a child by using the direct reference to the instance', () => {
      const firstChild = component.child()
      const secondChild = component.child(1)
      component.removeChild(firstChild)
      expect(component.child()).to.equal(secondChild)
    })

    it('should be able to get the listItem instance from any of its children down its tree', () => {
      const targetChild = new Component({
        type: 'label',
        style: { color: '0x000000ff' },
        dataKey: 'abcccccccc',
      })
      const child1 = createComponent({
        type: 'list',
        contentType: 'listObject',
        iteratorVar: 'itemObject',
        listObject: [
          {
            title: 'hello this is my title',
            fruits: ['apple', 'orange'],
            vegetables: ['carrot', 'tomatoes'],
          },
          {
            title: 'hello this is my title#2',
            fruits: ['apple', 'plum'],
            vegetables: ['cilantro', 'spinach'],
          },
        ],
      })
      component.createChild(child1)
      const child1child = child1.createChild(
        createComponent({
          type: 'listItem',
          dataKey: 'loppoo',
          itemObject: '',
          onClick: [
            {
              actionType: 'updateObject',
              dataKey: 'Global.VideoChatObjStore.reference.edge',
              dataObject: 'itemObject',
            },
            {
              actionType: 'pageJump',
              destination: 'VideoChat',
            },
          ],
          style: {
            borderWidth: '1',
            borderColor: '0x00000011',
          },
        }),
      )
      child1child.createChild(
        createComponent({
          type: 'label',
          dataKey: 'itemObject.name.hostName',
        }),
      )
      child1child.createChild(
        createComponent({
          type: 'label',
          dataKey: 'itemObject.name.roomName',
          style: { color: '0x000000ff' },
        }),
      )
      const parentOfTargetChild = child1child.createChild(
        createComponent({
          type: 'view',
          dataKey: 'itemObject.name.roomName',
          style: { color: '0x000000ff' },
        }),
      )
      child1child.createChild(
        createComponent({
          type: 'image',
          path: 'rightArrow.png',
          style: { left: '0.88' },
        }),
      )
      const expectedChild = parentOfTargetChild.createChild(
        createComponent({
          type: 'view',
          style: {},
        }),
      )
      expectedChild.createChild(targetChild)
      const expectedResult = targetChild?.parent()?.parent()?.parent()
      expect(expectedResult).to.equal(child1child)
    })
  })

  describe('when attaching event handlers', () => {
    xit('should attach ', () => {
      //
    })
  })
})
