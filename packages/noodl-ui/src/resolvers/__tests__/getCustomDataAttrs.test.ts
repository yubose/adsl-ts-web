import { expect } from 'chai'
import { createResolverTest, noodlui } from '../../utils/test-utils'
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

  it.only('should set the data-name', () => {
    expect(
      getCustomDataAttrs({ type: 'label', dataKey: 'formData.password' }).get(
        'data-name',
      ),
    ).eq('password')
  })

  xit('should set the data-value', () => {
    //
  })

  xit('should assign the data-key, data-name and data-value', () => {
    //
  })

  it('should attach the data attribute for contentType: passwordHidden components and its value as passwordHidden', () => {
    const label = getCustomDataAttrs({
      type: 'label',
      contentType: 'passwordHidden',
    })
    expect(label.get('data-ux')).to.eq('passwordHidden')
  })

  it('should attach the data attribute for popUp components and use viewTag as the value', () => {
    expect(
      getCustomDataAttrs({ type: 'popUp', viewTag: 'apple' }).toJS(),
    ).to.have.property('data-ux', 'apple')
  })

  it('should attach listId for list components', () => {
    expect(
      getCustomDataAttrs({
        type: 'list',
        listObject: [{ george: 'what' }],
        children: [],
      }).toJS(),
    ).to.have.property('listId')
  })

  xit('should attach the data-value value from an itemObject component for dates', () => {
    const result = resolve({
      type: 'list',
      id: 'abc123',
      'text=func': () => {},
    })
  })

  it('should attach the data-name prop for components that have a dataKey', () => {
    expect(
      getCustomDataAttrs({
        type: 'list',
        id: 'abc123',
        dataKey: 'hehe',
        iteratorVar: 'hello',
        children: [],
      }).toJS(),
    ).to.have.property('data-name')
  })

  describe('when working with dataKey', () => {
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

      xit('should resolve the dataKey and iteratorVar on the emit action instance', () => {
        // expect()
      })
    })

    describe('when resolving data values related to text=func', () => {
      //
    })
  })

  describe('should attach viewTag as the value for data-ux', () => {
    xit('', () => {
      //
    })
  })
})
