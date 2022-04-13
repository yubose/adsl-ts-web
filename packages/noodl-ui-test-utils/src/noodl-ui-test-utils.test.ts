import { expect } from 'chai'
import * as u from '@jsmanifest/utils'
import * as lib from './noodl-ui-test-utils'

const createTest = <Exp extends Record<string, any>>({
  value,
  expected,
}: {
  value: any
  expected: Exp
}) => [value, expected] as [any, Exp]

describe(u.yellow(`noodl-ui-test-utils`), () => {
  describe(u.italic('createActionObject'), () => {
    //
  })

  describe(u.italic(`createComponent`), () => {
    it(`should spread the props`, () => {
      const component = lib.getPopUpComponent({ global: true })
      expect(component).to.have.property('global', true)
      expect(component).to.have.property('popUpView', component.popUpView)
      console.log(component)
    })
  })

  describe(u.italic('getBuiltInAction'), () => {
    ;[
      createTest({
        value: { funcName: 'show' },
        expected: { funcName: 'show' },
      }),
      createTest({ value: 'abc', expected: { funcName: 'abc' } }),
      createTest({ value: undefined, expected: { funcName: 'redraw' } }),
    ].forEach(([props, expected]) => {
      it(`should have actionType: 'builtIn' and the funcName`, () => {
        expect(lib.getBuiltInAction(props)).to.deep.eq({
          actionType: 'builtIn',
          ...expected,
        })
      })
    })
  })

  describe(`should have type: 'label' and text`, () => {
    ;[
      createTest({ value: { text: 'hello' }, expected: { text: 'hello' } }),
      createTest({ value: 'Cereal', expected: { text: 'Cereal' } }),
      createTest({ value: undefined, expected: { text: 'Hello' } }),
    ].forEach(([props, expected]) => {
      it(`should set type: label and a text value`, () => {
        expect(lib.getLabelComponent(props)).to.deep.eq({
          type: 'label',
          ...expected,
        })
      })
    })
  })

  describe(u.italic('getListComponent'), () => {
    it(`should return a list component object`, () => {
      const list = lib.getListComponent({
        listObject: lib.getGenderListObject(),
      })
      expect(list).to.have.property('type', 'list')
      expect(list).to.have.property('contentType', 'listObject')
      expect(list).to.have.property('iteratorVar', 'itemObject')
      expect(list)
        .to.have.property('listObject')
        .to.deep.eq([
          { key: 'Gender', value: 'Male' },
          { key: 'Gender', value: 'Female' },
          { key: 'Gender', value: 'Other' },
        ])
      expect(list).to.have.property('children')
      expect(list.children).to.have.lengthOf(1)
      expect(list.children?.[0]).to.have.property('type', 'listItem')
      expect(list.children?.[0]).to.have.property('itemObject', '')
    })
  })

  describe(`getListItemComponent`, () => {
    ;[
      createTest({ value: { text: 'hello' }, expected: { text: 'hello' } }),
      createTest({ value: 'Cereal', expected: { text: 'Cereal' } }),
      createTest({ value: undefined, expected: { text: 'Hello' } }),
    ].forEach(([props, expected]) => {
      it(`should set type: label and a text value`, () => {
        expect(lib.getLabelComponent(props)).to.deep.eq({
          type: 'label',
          ...expected,
        })
      })
    })
  })
})
