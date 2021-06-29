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
      expect('dataKey' in component.props).to.be.false
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

  describe(italic(`data-options`), () => {
    let iteratorVar = 'itemObject'
    let listObject: { key: string; doc: number[] }[]

    beforeEach(() => {
      listObject = [
        { key: 'children', doc: [1, 2, 3, 4] },
        { key: 'adults', doc: [18, 19, 20, 21] },
        { key: 'seniors', doc: [59, 60, 61, 62] },
      ]
      createDataKeyReference({
        pageObject: { formData: { doc: listObject } },
      })
    })

    describe(`when options is provided through a reference string`, () => {
      it(`should use options as the dataKey to get its options`, async () => {
        const component = NUI.resolveComponents(
          mock.getListComponent({
            contentType: 'listObject',
            iteratorVar,
            listObject,
            children: [
              mock.getListItemComponent({
                [iteratorVar]: '',
                children: [
                  mock.getSelectComponent({ options: 'itemObject.doc' } as any),
                ],
              }),
            ],
          }),
        )
        const select1 = component.child().child()
        const select2 = component.child(1).child()
        const select3 = component.child(2).child()
        await waitFor(() => {
          expect(select1.get('data-options')).to.eq(listObject[0].doc)
          expect(select2.get('data-options')).to.eq(listObject[1].doc)
          expect(select3.get('data-options')).to.eq(listObject[2].doc)
        })
      })
    })

    it(`should emit the "options" component event`, async () => {
      const spy1 = sinon.spy()
      const spy2 = sinon.spy()
      const spy3 = sinon.spy()
      const component = NUI.resolveComponents(
        mock.getListComponent({
          contentType: 'listObject',
          iteratorVar,
          listObject,
          children: [
            mock.getListItemComponent({
              [iteratorVar]: '',
              children: [
                mock.getSelectComponent({ options: 'itemObject.doc' }),
              ],
            }),
          ],
        }),
      )
      component.child().child().on('options', spy1)
      component.child(1).child().on('options', spy2)
      component.child(2).child().on('options', spy3)
      const spies = [spy1, spy2, spy3]
      await waitFor(() => {
        spies.forEach((spy, index) => {
          expect(spy).to.be.calledOnce
          expect(spy).to.be.calledWith(listObject[index].doc)
        })
      })
    })
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
    it('should pass the value from the emit executor', async () => {
      const spy = sinon.spy(() => Promise.resolve('iamjoshua'))
      const dataObject = { fruit: 'apple' }
      const iteratorVar = 'hello'
      const listObject = [dataObject, { fruit: 'orange' }]
      NUI.use({ emit: { dataValue: spy } })
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
                      dataValue: mock.getFoldedEmitObject({
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
      await waitFor(() => {
        expect(textField.get('data-value')).to.eq('iamjoshua')
      })
    })
  })

  it('should look in the page object to find its dataObject (non list consumers)', () => {
    const pageObject = { hello: { gender: 'Female' } }
    createDataKeyReference({ pageObject })
    expect(
      NUI.resolveComponents(
        mock.getLabelComponent({ type: 'label', dataKey: 'hello.gender' }),
      ).get('data-value'),
    ).to.eq('Female')
  })

  it(
    'should attempt to look into the root object if a dataObject ' +
      'isnt available in the page object',
    () => {
      const pageObject = { hello: { gender: 'Female' } }
      createDataKeyReference({ pageName: 'SignIn', pageObject })
      expect(
        NUI.resolveComponents(
          mock.getLabelComponent({
            type: 'label',
            dataKey: 'SignIn.hello.gender',
          }),
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
