import { expect } from 'chai'
import sinon from 'sinon'
import createComponent from '../../utils/createComponent'
import { createResolverTest, noodlui } from '../../utils/test-utils'
import _getTransformedAliases from '../getTransformedAliases'

let getTransformedAliases: any

beforeEach(() => {
  getTransformedAliases = createResolverTest(_getTransformedAliases)
})

describe('getTransformedAliases', () => {
  it('should return the correct inputType', () => {
    let result: any

    result = getTransformedAliases({ contentType: 'email' })
    expect(result.contentType).to.eq('email')

    result = getTransformedAliases({ contentType: 'tel' })
    expect(result.contentType).to.eq('tel')

    result = getTransformedAliases({ contentType: 'countryCode' })
    expect(result.contentType).to.eq('countryCode')

    result = getTransformedAliases({ contentType: 'phone' })
    expect(result.contentType).to.eq('phone')
  })

  it('should prepend the assetsUrl if it doesnt start with a protocol like https://', () => {
    const result = getTransformedAliases({ path: 'hello123' })
    expect(result.get('src')).to.eq('https://something.com/assets/hello123')
  })

  it('should not prepend anything and leave it as is if the it already starts with a protocol like https://', () => {
    const result = getTransformedAliases({
      resource: 'https://google.com/hello123',
    })
    expect(result.get('src')).to.equal('https://google.com/hello123')
  })

  it('should transform the options property for †he select element', () => {
    const result = getTransformedAliases({ options: ['one', 'two', 'three'] })
    const computedOptions = [
      { index: 0, key: 'one', value: 'one', label: 'one' },
      { index: 1, key: 'two', value: 'two', label: 'two' },
      { index: 2, key: 'three', value: 'three', label: 'three' },
    ]
    expect(result.get('options')).to.have.deep.members(computedOptions)
  })

  describe('when using the path ("if" object)', () => {
    it('should handle strings starting with "http"', () => {
      const first = 'selectedHand.png'
      const second = 'unselectedHand.png'
      // const result = getTransformedAliases({
      //   type: 'image',
      //   path: { if: ['abc', first, second] },
      // })
      // expect(result.src).to.equal(`${assetsUrl}${first}`)
    })

    xit('should handle strings not starting with "http"', () => {
      //
    })

    xit('should handle "if" objects', () => {
      //
    })

    describe('when handling emit path objects', () => {
      xit('should not call registered emit handlers that are not the "path" trigger', () => {
        //
      })

      it('should use the return value from emit objects if provided (non-promise)', async () => {
        const emitSpy = sinon.spy(() => 'abc.png')
        const path = { emit: { dataKey: { var1: 'itemObject' }, actions: [] } }
        const useEmitObj = { actionType: 'emit', fn: emitSpy, trigger: 'path' }
        noodlui.use(useEmitObj as any)
        const image = createComponent({ type: 'image', path })
        const result = await noodlui.createSrc(path as any, image)
        expect(result).to.eq(noodlui.assetsUrl + 'abc.png')
      })

      it('should use the return value from emit objects if provided (promise)', async () => {
        const expectedResult = noodlui.assetsUrl + '123.jpeg'
        const emitSpy = sinon.spy(() => Promise.resolve('123.jpeg'))
        const path = { emit: { dataKey: { var1: 'itemObject' }, actions: [] } }
        const useEmitObj = { actionType: 'emit', fn: emitSpy, trigger: 'path' }
        noodlui.use(useEmitObj as any)
        const image = createComponent({ type: 'image', path })
        const result = await noodlui.createSrc(image as any)
        expect(result).to.eq(expectedResult)
      })

      it('should receive the EmitAction instance as the first arg', async () => {
        const iteratorVar = 'hello'
        const listId = 'mylistid'
        const listObject = [{ fruit: 'apple' }]
        const emitSpy = sinon.spy()
        const useEmitObj = { actionType: 'emit', fn: emitSpy, trigger: 'path' }
        noodlui.use(useEmitObj)
        const list = noodlui.resolveComponents({
          type: 'list',
          iteratorVar,
          listId,
          listObject,
          children: [{ type: 'listItem' }],
        })
        const path = { emit: { dataKey: { var1: 'itemObject' }, actions: [] } }
        const image = createComponent({ type: 'image', path })
        list.child()?.createChild(image)
        const result = await noodlui.createSrc(image)
      })

      xit('should have its dataKey and dataObject populated', () => {
        //
      })
    })

    it('should use the 3rd item if the evaluation is falsy', () => {
      const first = 'selectedHand.png'
      const second = 'unselectedHand.png'
      // expect(result.src).to.equal(`${assetsUrl}${second}`)
    })
  })
})
