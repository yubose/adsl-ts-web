import { expect } from 'chai'
import sinon from 'sinon'
import createComponent from '../../utils/createComponent'
import { assetsUrl, noodlui } from '../../utils/test-utils'

describe('getTransformedAliases', () => {
  it('should return the correct inputType', () => {
    let result: any

    result = resolve({ contentType: 'email' })
    expect(result.contentType).to.eq('email')

    result = resolve({ contentType: 'tel' })
    expect(result.contentType).to.eq('tel')

    result = resolve({ contentType: 'countryCode' })
    expect(result.contentType).to.eq('countryCode')

    result = resolve({ contentType: 'phone' })
    expect(result.contentType).to.eq('phone')
  })

  it('should prepend the assetsUrl if it doesnt start with a protocol like https://', () => {
    const result = resolve({ path: 'hello123' })
    expect(result).to.have.property(
      'src',
      'https://something.com/assets/hello123',
    )
  })

  it('should not prepend anything and leave it as is if the it already starts with a protocol like https://', () => {
    const result = resolve({ resource: 'https://google.com/hello123' })
    expect(result.src).to.equal('https://google.com/hello123')
  })

  it('should transform the options property for †he select element', () => {
    const result = resolve({ options: ['one', 'two', 'three'] })
    const computedOptions = [
      { index: 0, key: 'one', value: 'one', label: 'one' },
      { index: 1, key: 'two', value: 'two', label: 'two' },
      { index: 2, key: 'three', value: 'three', label: 'three' },
    ]
    expect(result.options).to.have.deep.members(computedOptions)
  })

  describe.only('when using the path ("if" object)', () => {
    it('should handle strings starting with "http"', () => {
      const first = 'selectedHand.png'
      const second = 'unselectedHand.png'
      // const result = resolve({
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

    describe.only('when handling emit path objects', () => {
      xit('should not call registered emit handlers that are not the "path" trigger', () => {
        //
      })

      it('should use the return value from emit objects if provided (non-promise)', () => {
        const emitSpy = sinon.spy(() => 'abc.png')
        const path = { emit: { dataKey: { var1: 'itemObject' }, actions: [] } }
        const useEmitObj = { actionType: 'emit', fn: emitSpy, trigger: 'path' }
        noodlui.use(useEmitObj)
        const image = createComponent({ type: 'image', path })
        const result = noodlui.createSrc(image)
        expect(result).to.eq(noodlui.assetsUrl + 'abc.png')
      })

      it('should use the return value from emit objects if provided (promise)', async () => {
        const expectedResult = noodlui.assetsUrl + '123.jpeg'
        const emitSpy = sinon.spy(async () => Promise.resolve('123.jpeg'))
        const path = { emit: { dataKey: { var1: 'itemObject' }, actions: [] } }
        const useEmitObj = { actionType: 'emit', fn: emitSpy, trigger: 'path' }
        noodlui.use(useEmitObj)
        const image = createComponent({ type: 'image', path })
        const result = await noodlui.createSrc(image)
        expect(result).to.eq(expectedResult)
      })

      it('should receive the EmitAction instance as the first arg', async () => {
        const iteratorVar = 'hello'
        const listId = 'mylistid'
        const listObject = [{ fruit: 'apple' }]
        const list = noodlui.resolveComponents({
          type: 'list',
          iteratorVar,
          listId,
          listObject,
          children: [{ type: 'listItem' }],
        })
        const emitSpy = sinon.spy()
        const path = { emit: { dataKey: { var1: 'itemObject' }, actions: [] } }
        const useEmitObj = { actionType: 'emit', fn: emitSpy, trigger: 'path' }
        noodlui.use(useEmitObj)
        const image = createComponent({ type: 'image', path })
        list.child()?.createChild(image)
        const result = await noodlui.createSrc(image)
        console.info(emitSpy.args[0][0])
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
