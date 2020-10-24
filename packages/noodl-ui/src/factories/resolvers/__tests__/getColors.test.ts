import { expect } from 'chai'
import { makeResolverTest } from '../../utils/test-utils'

let resolve: any

beforeEach(() => {
  resolve = makeResolverTest()
})

describe('getColors', () => {
  it('should return an object renaming textColor to color', () => {
    const result = resolve({ style: { textColor: '0x33445566' } })
    expect(result.style).not.to.have.property('textColor')
    expect(result.style).to.have.property('color', '#33445566')
  })

  it('should format color values like 0x000000 to #000000', () => {
    const result = resolve({ style: { abc: '0x33210299' } })
    expect(result.style.abc).to.eq('#33210299')
  })
})
