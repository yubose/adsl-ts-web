import { expect } from 'chai'
import { makeResolverTest } from '../../utils/test-utils'

let resolve: any

beforeEach(() => {
  resolve = makeResolverTest()
})

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
})
