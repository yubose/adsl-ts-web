import * as mock from 'noodl-ui-test-utils'
import sinon from 'sinon'
import { ComponentObject } from 'noodl-types'
import { waitFor } from '@testing-library/dom'
import { expect } from 'chai'
import { coolGold, italic } from 'noodl-common'
import NUI from '../../noodl-ui'
import { createDataKeyReference } from '../../utils/test-utils'

function resolveComponent(component: ComponentObject) {
  const page = NUI.createPage({
    name: 'Hello',
    viewport: { width: 375, height: 667 },
  })

  return {
    component: NUI.resolveComponents({ components: component, page }),
    page,
  }
}

describe(coolGold(`resolveDataAttrs`), () => {
  describe(italic(`data-key`), () => {
    it('should set the data-key and remove the dataKey property', () => {
      const { component } = resolveComponent(
        mock.getLabelComponent({ dataKey: 'formData.password' }),
      )
      expect(component.get('data-key')).to.eq('formData.password')
      expect('dataKey' in component.props()).to.be.false
    })
  })

  describe(italic(`data-value`), () => {
    it('should set the data-value for list consumers', () => {
      createDataKeyReference({
        pageObject: { info: { gender: mock.getGenderListObject() } },
      })
      const { component } = resolveComponent(
        mock.getListComponent({
          listObject: mock.getGenderListObject(),
          iteratorVar: 'cereal',
          children: [
            mock.getListItemComponent({
              children: [
                mock.getLabelComponent({ dataKey: 'cereal.key' }),
                mock.getTextFieldComponent({ dataKey: 'cereal.value' }),
              ],
            }),
          ],
        }),
      )
      const listItem = component.child()
      const label = listItem.child()
      const textField = listItem.child(1)
      expect(label.get('data-value')).to.eq('Gender')
      expect(textField.get('data-value')).to.eq('Male')
    })
  })

  it('should set the data-value for non list consumers', () => {
    createDataKeyReference({
      pageObject: { formData: { email: 'pfft@gmail.com' } },
    })
    expect(
      NUI.resolveComponents({
        components: mock.getLabelComponent({
          type: 'label',
          dataKey: 'formData.email',
        }),
      }).get('data-value'),
    ).eq('pfft@gmail.com')
  })

  describe(italic(`data-viewtag`), () => {
    it('should attach viewTag as the value for data-viewtag', () => {
      expect(
        NUI.resolveComponents({
          components: mock.getLabelComponent({
            type: 'label',
            viewTag: 'hello',
          }),
        }).get('data-viewtag'),
      ).to.eq('hello')
    })
  })

  describe(italic(`data-listid`), () => {
    it('should attach data-listid for list components', () => {
      expect(
        NUI.resolveComponents({
          components: mock.getListComponent({
            type: 'list',
            listObject: [{ george: 'what' }],
            children: [],
          }),
        }).get('data-listid'),
      ).to.exist
    })
  })

  describe(italic(`data-ux`), () => {
    it(
      `should attach the data attribute for contentType: passwordHidden ` +
        `components and its value as passwordHidden`,
      () => {
        const label = NUI.resolveComponents({
          components: mock.getLabelComponent({
            type: 'label',
            contentType: 'passwordHidden',
          }),
        })
        expect(label.get('data-ux')).to.eq('passwordHidden')
      },
    )
  })

  it(
    `should use the dataKey and text=func function to resolve the ` +
      `expected data-value for date (text=func) components`,
    () => {
      const result = '10 seconds ago'
      expect(
        resolveComponent(
          mock.getLabelComponent({
            type: 'label',
            text: '2020/08/02',
            dataKey: 'hello12345',
            textfunc: () => result,
          }),
        ).component.get('data-value'),
      )
    },
  )

  describe('when handling dataValue emits', () => {
    it.only('should pass the value from the emit executor', async () => {
      const spy = sinon.spy(() => Promise.resolve('iamjoshua'))
      const dataObject = { fruit: 'apple' }
      const iteratorVar = 'hello'
      const listObject = [dataObject, { fruit: 'orange' }]
      NUI.use({ actionType: 'emit', fn: spy, trigger: 'dataValue' })
      const { component: view } = resolveComponent(
        mock.getViewComponent({
          children: [
            mock.getListComponent({
              contentType: 'listObject',
              listObject,
              iteratorVar,
              children: [
                mock.getListItemComponent({
                  children: [
                    mock.getTextFieldComponent({
                      dataKey: `${iteratorVar}.fruit`,
                      dataValue: mock.getEmitObject({
                        dataKey: { var1: iteratorVar },
                      }),
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      )
      const list = view.child()
      const listItem = list.child()
      const textField = listItem.child()
      console.info(textField)
      await waitFor(() => {
        expect(textField.get('data-value')).to.eq('iamjoshua')
      })
    })
  })

  it('should look in the page object to find its dataObject (non list consumers)', () => {
    const pageObject = { hello: { gender: 'Female' } }
    expect(
      NUI.resolveComponents(
        mock.getLabelComponent(
          { type: 'label', dataKey: 'hello.gender' },
          { getPageObject: () => pageObject },
        ),
      ).get('data-value'),
    ).to.eq('Female')
  })

  it(
    'should attempt to look into the root object if a dataObject ' +
      'isnt available in the page object',
    () => {
      const pageObject = { hello: { gender: 'Female' } }
      expect(
        NUI.resolveComponents(
          mock.getLabelComponent(
            { type: 'label', dataKey: 'SignIn.hello.gender' },
            { getRoot: () => ({ SignIn: pageObject }) },
          ),
        ).get('data-value'),
      ).to.eq('Female')
    },
  )

  describe('when the dataKey is an emit object', () => {
    let listObject = [] as { key: string; value: string }[]
    let iteratorVar = 'helloObject'
    let emitObj: {
      emit: { dataKey: { var1: string; var2: string }; actions: any[] }
    }
    let list: {
      type: string
      iteratorVar: string
      listObject: typeof listObject
      children: {
        [x: string]:
          | string
          | {
              type: 'label'
              dataKey: {
                emit: {
                  dataKey: { var1: string; var2: string }
                  actions: any[]
                }
              }
            }[]
        type: 'listItem'
        children: { type: 'label'; dataKey: typeof emitObj }[]
      }[]
    }

    beforeEach(() => {
      listObject = [
        { key: 'gender', value: 'Male' },
        { key: 'gender', value: 'Female' },
        { key: 'gender', value: 'Other' },
      ]
      iteratorVar = 'helloObject'
      emitObj = {
        emit: {
          dataKey: { var1: iteratorVar, var2: `${iteratorVar}.gender` },
          actions: [],
        },
      }
      list = resolveComponent(
        mock.getListComponent({
          type: 'list',
          iteratorVar,
          listObject,
          children: [
            {
              type: 'listItem',
              [iteratorVar]: '',
              children: [{ type: 'label', dataKey: emitObj }],
            },
          ],
        }),
      )
    })
  })
})
