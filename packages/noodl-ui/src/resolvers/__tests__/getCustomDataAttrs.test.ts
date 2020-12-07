import { expect } from 'chai'
import { createComponent } from '../../../dist'
import { createResolverTest } from '../../utils/test-utils'
import getCustomDataAttrsResolver from '../getCustomDataAttrs'

let getCustomDataAttrs: ReturnType<typeof createResolverTest>

beforeEach(() => {
  getCustomDataAttrs = createResolverTest(getCustomDataAttrsResolver)
})

describe('getCustomDataAttrs', () => {
  it('should set the data-key', () => {
    expect(
      getCustomDataAttrs({ type: 'label', dataKey: 'formData.password' }).get(
        'data-key',
      ),
    ).eq('formData.password')
  })

  it('should set the data-name', () => {
    expect(
      getCustomDataAttrs({ type: 'label', dataKey: 'formData.password' }).get(
        'data-name',
      ),
    ).eq('password')
  })

  it('should set the data-value for list consumers', () => {
    expect(
      getCustomDataAttrs({ type: 'label', dataKey: 'formData.password' }).get(
        'data-name',
      ),
    ).eq('password')
  })

  it('should set the data-value for non list consumers', () => {
    expect(
      getCustomDataAttrs({ type: 'label', dataKey: 'formData.password' }).get(
        'data-name',
      ),
    ).eq('password')
  })

  it('should attach viewTag as the value for data-viewtag', () => {
    expect(
      getCustomDataAttrs({ type: 'label', viewTag: 'hello' }).get(
        'data-viewtag',
      ),
    ).to.eq('hello')
  })

  it('should attach data-listid for list components', () => {
    expect(
      getCustomDataAttrs({
        type: 'list',
        listObject: [{ george: 'what' }],
        children: [],
      }).get('data-listid'),
    ).to.exist
  })

  it('should attach the data attribute for contentType: passwordHidden components and its value as passwordHidden', () => {
    const label = getCustomDataAttrs({
      type: 'label',
      contentType: 'passwordHidden',
    })
    expect(label.get('data-ux')).to.eq('passwordHidden')
  })

  it('should use the dataKey and text=func function to resolve the expected data-value for date (text=func) components', () => {
    const result = '10 seconds ago'
    expect(
      getCustomDataAttrs({
        type: 'label',
        text: '2020/08/02',
        dataKey: 'hello12345',
        'text=func': () => result,
      }).get('data-value'),
    ).to.eq(result)
  })

  describe('when working with the dataKey', () => {
    describe('when handling dataValue emits', () => {
      xit('should pass the value from the emit executor', async () => {
        const iteratorVar = 'hello'
        const dataObject = { fruit: 'apple' }
        const listObject = [dataObject, { fruit: 'orange' }]
        const list = createComponent({
          type: 'list',
          listObject,
          iteratorVar,
          children: [],
        })
        const listItem = createComponent({
          type: 'listItem',
          iteratorVar,
          children: [],
        })
        const textField = createComponent({
          type: 'textField',
          dataKey: `${iteratorVar}.fruit`,
          iteratorVar,
          dataValue: {
            emit: { dataKey: { var1: iteratorVar }, actions: [] },
          },
        })
        list.createChild(listItem)
        list.set('listObject', listObject)
        listItem.createChild(textField)
        listItem.setDataObject(dataObject)
        getCustomDataAttrs(list)
        expect(textField.get('data-value')).to.eq('apple')
      })
    })

    it('should look in the page object to find its dataObject (non list consumers)', () => {
      const pageName = 'SignIn'
      expect(
        getCustomDataAttrs(
          { type: 'label', dataKey: 'hello.gender' },
          {
            context: { page: pageName },
            getRoot: () => ({
              [pageName]: { hello: { gender: 'Female' } },
            }),
            page: pageName,
          },
        ).get('data-value'),
      ).to.eq('Female')
    })

    xit(
      'should attempt to look into the root object if a dataObject ' +
        'isnt available in the page object',
      () => {
        //
      },
    )

    xit('should attempt to resolve reference dotted dataKeys', () => {
      //
    })

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
        list = getCustomDataAttrs({
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
        }) as any
      })
    })
  })
})
