import path from 'path'
import { expect } from 'chai'
import { createComponent, NOODLComponent } from 'noodl-ui'
import { getShape, getShapeKeys } from './utils'

xdescribe('noodl-ui-dom', () => {
  xit('should attach an "events" property as an array if their component has an event', () => {
    //
  })

  describe('getShape', () => {
    let dataKey: string
    let iteratorVar: string
    let listObject: any[]
    let listId: string
    let noodlComponent: NOODLComponent

    beforeEach(() => {
      dataKey = 'formData.password'
      iteratorVar = 'hello'
      listObject = [
        { fruit: 'apple' },
        { fruit: 'banana' },
        { fruit: 'orange' },
      ]
      listId = 'mylistid123'
      path = { emit: { dataKey: { var1: 'hello' }, actions: [{}, {}, {}] } }
      noodlComponent = {
        type: 'label',
        contentType: 'number',
        // @ts-expect-error
        'data-key': dataKey as string,
        'data-value': 'mypassword',
        'data-listid': listId,
        'data-ux': 'genderTag',
        'data-name': 'password',
        dataKey,
        listObject,
        iteratorVar,
        placeholder: 'You do not have a password yet',
        required: 'true',
        style: {
          fontSize: '14',
          top: '0',
          left: '0.1',
          color: '0x000000',
        },
        text: 'mytext',
        viewTag: 'genderTag',
        children: [
          { type: 'label', text: 'hi', style: {} },
          { type: 'button', path: 'abc.png' },
        ],
      }
    })

    it('should return an object with properties only in the shapeKeys list', () => {
      const component = createComponent(noodlComponent)
      const shape = getShape(component)
      const shapeKeys = getShapeKeys()
      const shapeKeysResults = Object.keys(shape)
      shapeKeysResults.forEach((keyResult) => {
        expect(shapeKeys.includes(keyResult)).to.be.true
      })
    })

    it(
      'should return the default expected base shape for components ' +
        'that have them (NOODLComponent properties)',
      () => {
        const component = createComponent(noodlComponent)
        const shape = getShape(component)
        const shapeKeys = getShapeKeys()
        Object.keys(noodlComponent).forEach((key) =>
          !shapeKeys.includes(key) ? delete noodlComponent[key] : undefined,
        )
        Object.keys(noodlComponent).forEach((k) => {
          expect(noodlComponent[k]).to.deep.eq(shape[k])
          delete shape[k]
        })
        expect(Object.keys(shape)).to.have.lengthOf(0)
      },
    )
  })
})
