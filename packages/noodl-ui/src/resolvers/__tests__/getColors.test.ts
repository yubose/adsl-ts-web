import { expect } from 'chai'
import { createResolverTest } from '../../utils/test-utils'
import _getColors from '../getColors'

let getColors: any

beforeEach(() => {
  getColors = createResolverTest(_getColors)
})

describe('getColors', () => {
  it('should return an object renaming textColor to color', () => {
    const result = getColors({ style: { textColor: '0x33445566' } })
    expect(result.style).to.have.property('color', '#33445566')
  })

  it('should format color values like 0x000000 to #000000', () => {
    const result = getColors({ style: { abc: '0x33210299' } })
    expect(result.style.abc).to.eq('#33210299')
  })
})
