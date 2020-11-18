import sinon from 'sinon'
import fs from 'fs-extra'
import path from 'path'
import { prettyDOM, screen } from '@testing-library/dom'
import chalk from 'chalk'
import { expect } from 'chai'
import {
  IComponentTypeInstance,
  IList,
  NOODLComponent,
  NOODLComponentProps,
} from 'noodl-ui'
import { listenToDOM, noodlui, noodluidom, toDOM } from './test-utils'

describe('noodl-ui-dom', () => {
  xit('should add the func to the callbacks list', () => {
    const spy = sinon.spy()
    noodluidom.on('create.button', spy)
    const callbacksList = noodluidom.getCallbacks('create.button')
    expect(callbacksList).to.be.an('array')
    expect(callbacksList).to.have.members([spy])
  })

  xit('should remove the func from the callbacks list', () => {
    const spy = sinon.spy()
    noodluidom.on('create.button', spy)
    let callbacksList = noodluidom.getCallbacks('create.button')
    expect(callbacksList).to.have.members([spy])
    noodluidom.off('create.button', spy)
    callbacksList = noodluidom.getCallbacks('create.button')
    expect(callbacksList).to.be.an('array')
    expect(callbacksList).not.to.include.members([spy])
  })

  it('should emit events', () => {
    const spy = sinon.spy()
    noodluidom.on('create.label', spy)
    expect(spy.called).to.be.false
    // @ts-expect-error
    noodluidom.emit('create.label')
    expect(spy.called).to.be.true
  })

  describe('calling the appropriate event', () => {
    let fn1: sinon.SinonSpy
    let fn2: sinon.SinonSpy
    let fn3: sinon.SinonSpy

    beforeEach(() => {
      fn1 = sinon.spy()
      fn2 = sinon.spy()
      fn3 = sinon.spy()
      noodluidom.on('create.button', fn1)
      noodluidom.on('create.image', fn2)
      noodluidom.on('create.button', fn3)
    })

    xit('should call callbacks that were subscribed', () => {
      noodluidom.parse(
        noodlui.resolveComponents({
          id: 'myid123',
          type: 'button',
          noodlType: 'button',
          text: 'hello',
        } as NOODLComponent),
      )
      expect(fn1.called).to.be.true
      expect(fn3.called).to.be.true
    })

    it('should not call callbacks that were not subscribed', () => {
      noodluidom.parse(
        noodlui.resolveComponents({
          id: 'myid123',
          type: 'label',
          noodlType: 'label',
          text: 'hello',
        } as NOODLComponent),
      )
      expect(fn1.called).to.be.false
      expect(fn2.called).to.be.false
      expect(fn3.called).to.be.false
    })
  })

  describe('isValidAttribute', () => {
    it('should return true for possible assigned attributes on the dom node', () => {
      expect(noodluidom.isValidAttr('div', 'style')).to.be.true
      expect(noodluidom.isValidAttr('div', 'setAttribute')).to.be.true
      expect(noodluidom.isValidAttr('div', 'id')).to.be.true
      expect(noodluidom.isValidAttr('div', 'dataset')).to.be.true
    })

    it('should return false for all of these', () => {
      expect(noodluidom.isValidAttr('div', 'abc')).to.be.false
      expect(noodluidom.isValidAttr('div', 'value')).to.be.false
      expect(noodluidom.isValidAttr('div', 'options')).to.be.false
    })

    it('should return true for all of these', () => {
      expect(noodluidom.isValidAttr('textarea', 'value')).to.be.true
      expect(noodluidom.isValidAttr('input', 'value')).to.be.true
      expect(noodluidom.isValidAttr('select', 'value')).to.be.true
      expect(noodluidom.isValidAttr('input', 'placeholder')).to.be.true
      expect(noodluidom.isValidAttr('input', 'required')).to.be.true
    })

    it('should return false for all of these', () => {
      expect(noodluidom.isValidAttr('select', 'abc')).to.be.false
      expect(noodluidom.isValidAttr('select', 'rows')).to.be.false
      expect(noodluidom.isValidAttr('input', 'rows')).to.be.false
      expect(noodluidom.isValidAttr('textarea', 'options')).to.be.false
    })
  })

  xdescribe('parse', () => {
    it('should return the expected node', () => {
      const label = noodlui.resolveComponents({
        type: 'label',
        text: 'Title',
        style: {
          color: '0xffffffff',
          width: '0.6',
          height: '0.04',
          fontSize: '18',
          fontStyle: 'bold',
        },
      })
      noodluidom.on('create.label', (node, props) => {
        if (node) node.innerHTML = `${props.children}`
      })
      const node = noodluidom.parse(label)
      if (node) document.body.appendChild(node)
      expect(node).to.be.instanceOf(HTMLLabelElement)
      expect(screen.getByText('Title'))
    })

    describe('recursing children', () => {
      const labelText = 'the #1 label'
      let component: NOODLComponentProps

      beforeEach(() => {
        component = {
          type: 'div',
          noodlType: 'view',
          id: 'abc',
          style: {
            left: '0',
          },
          children: [
            {
              type: 'div',
              noodlType: 'view',
              text: 'Back',
              style: {},
              id: 'label123',
              children: [
                {
                  type: 'ul',
                  noodlType: 'list',
                  id: 'list123',
                  contentType: 'listObject',
                  listObject: [],
                  iteratorVar: 'itemObject',
                  style: {},
                  children: [
                    {
                      type: 'label',
                      noodlType: 'label',
                      style: {},
                      id: 'label1223',
                      children: labelText,
                      text: labelText,
                    },
                  ],
                },
              ],
            },
          ],
        } as NOODLComponentProps
      })

      it('should append nested children as far down as possible', () => {
        noodluidom.on('create.label', (node, inst) => {
          if (node) node.innerHTML = inst.get('text')
        })
        noodluidom.parse(noodlui.resolveComponents(component))
        expect(screen.getByText(labelText))
      })
    })
  })

  describe('noodlType: plugin', () => {
    it('should receive null as the "DOM node" in the callback', () => {
      const spy = sinon.spy()
      const component = {
        id: '123',
        type: 'plugin',
        noodlType: 'plugin',
        path: 'https://what.com/what.jpg',
      } as NOODLComponent
      noodluidom.on('plugin', spy)
      noodluidom.parse(noodlui.resolveComponents(component), document.body)
      expect(spy.firstCall.args[0]).to.be.null
    })
  })

  describe('when using redraw', () => {
    let parent: IComponentTypeInstance
    let component: IList
    let iteratorVar: 'hello'
    let listObject: any[]

    // const builtInStringEqualMale = sinon.spy((obj) => obj.value === 'Male')
    const builtInStringEqualMale = (obj: any) => {
      // console.info('builtInStringEqualMale call start')
      // console.info(obj)
      // console.info(obj)
      // console.info(obj)
      // console.info('builtInStringEqualMale call end')
      return obj.value === 'Male'
    }
    const builtInStringEqualFemale = sinon.spy((obj) => obj.value === 'Female')
    const builtInStringEqualOther = sinon.spy((obj) => obj.value === 'Other')

    const mockEmit = (value: any) => (o: any) => value
    const emitMale = mockEmit('Male')
    const emitFemale = mockEmit('Female')
    const emitOther = mockEmit('Other')

    beforeEach(() => {
      iteratorVar = 'hello'
      listObject = [
        { key: 'Gender', value: 'Male' },
        { key: 'Gender', value: 'Female' },
        { key: 'Gender', value: 'Other' },
      ]

      noodlui
        .setRoot('PatientChartGeneralInfo', {
          GeneralInfo: {
            Radio: [{ key: 'Gender', value: '' }],
          },
        })
        .setPage('PatientChartGeneralInfo')

      const mockUpdateGender = (value: any) => () =>
        noodlui.setRoot('PatientChartGeneralInfo', {
          GeneralInfo: { Radio: [{ key: 'Gender', value }] },
        })

      const components = {
        type: 'view',
        children: [
          {
            type: 'list',
            contentType: 'listObject',
            listObject: [listObject[0]],
            iteratorVar,
            children: [
              {
                type: 'listItem',
                viewTag: 'genderTag',
                [iteratorVar]: '',
                children: [
                  {
                    type: 'image',
                    viewTag: 'maleTag',
                    // iteratorVar,
                    onClick: [
                      {
                        emit: {
                          dataKey: { var1: iteratorVar, var2: iteratorVar },
                          actions: [
                            {
                              if: [
                                builtInStringEqualMale,
                                mockUpdateGender(null),
                                mockUpdateGender('Male'),
                              ],
                            },
                          ],
                        },
                      },
                      {
                        actionType: 'builtIn',
                        funcName: 'redraw',
                        viewTag: 'genderTag',
                      },
                    ],
                    path: {
                      if: [
                        builtInStringEqualMale,
                        'selectOn.png',
                        'selectOff.png',
                      ],
                    },
                    style: { height: '0.025', width: '0.042', left: '0.15' },
                  },
                  {
                    type: 'label',
                    text: 'Male',
                    style: { fontSize: '13', top: '0', left: '0.25' },
                  },
                  {
                    type: 'image',
                    viewTag: 'femaleTag',
                    onClick: [
                      {
                        emit: [{ dataKey: { var1: iteratorVar } }],
                        actions: [
                          {
                            if: [
                              builtInStringEqualFemale,
                              mockUpdateGender(null),
                              mockUpdateGender('Female'),
                            ],
                          },
                        ],
                      },
                      {
                        actionType: 'builtIn',
                        funcName: 'redraw',
                        viewTag: 'genderTag',
                      },
                    ],
                    path: {
                      if: [
                        builtInStringEqualFemale,
                        'selectOn.png',
                        'selectOff.png',
                      ],
                    },
                    style: { width: '0.042', top: '0', left: '0.4' },
                  },
                  {
                    type: 'label',
                    text: 'Female',
                    style: { fontSize: '13', top: '0', left: '0.5' },
                  },
                  {
                    type: 'image',
                    viewTag: 'otherTag',
                    onClick: [
                      {
                        if: [
                          builtInStringEqualOther,
                          mockUpdateGender(null),
                          mockUpdateGender('Other'),
                        ],
                      },
                      {
                        actionType: 'builtIn',
                        funcName: 'redraw',
                        viewTag: 'genderTag',
                      },
                    ],
                    path: {
                      if: [
                        builtInStringEqualOther,
                        'selectOn.png',
                        'selectOff.png',
                      ],
                    },
                    style: { left: '0.7' },
                  },
                  {
                    type: 'label',
                    text: 'Other',
                    style: { fontSize: '13', top: '0', left: '0.75' },
                  },
                ],
              },
            ],
          },
        ],
      }

      parent = noodlui.resolveComponents(components)

      component = parent.child() as IList
      // listenToDOM()
      toDOM(parent)
    })

    it('should redraw the images', () => {
      const listNode = document.getElementsByTagName('ul')[0]
      const listItemNodes = Array.from(document.querySelectorAll('li'))
      const [liNode1, liNode2, liNode3] = listItemNodes
      const listItem1ImgNode = liNode1.querySelector('img')
      // liNode1?.click()
      expect(liNode1.querySelector('img')).to.have.property(
        'src',
        noodlui.assetsUrl + 'selectOn.png',
      )
      // console.info(chalk.magenta('UNCLICKED'))
      // console.info('     ' + chalk.yellow(listItem1ImgNode.src))
      listItem1ImgNode?.click()
      // console.info('     ' + chalk.yellow(listItem1ImgNode.src))
      // console.info(chalk.magenta('CLICKED'))
      // console.info(prettyDOM())
      expect(liNode1.querySelector('img')).to.have.property(
        'src',
        noodlui.assetsUrl + 'selectOff.png',
      )
      fs.writeJsonSync(
        path.resolve(path.join(process.cwd(), 'noodl-ui-dom.json')),
        {
          imgOnDOM: { src: listItem1ImgNode.src },
          component: component.toJS(),
        },
        { spaces: 2 },
      )
    })
  })
})
