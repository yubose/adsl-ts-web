import { expect } from 'chai'
import { createResolverTest } from '../../utils/test-utils'
import _getTransformedStyleAliases from '../getTransformedStyleAliases'

let getTransformedStyleAliases: any

beforeEach(() => {
  getTransformedStyleAliases = createResolverTest(_getTransformedStyleAliases)
})

describe('getTransformedStyleAliases', () => {
  it('should turn visibility to hidden if "isHidden" is true', () => {
    expect(
      getTransformedStyleAliases({ style: { isHidden: true } }).style,
    ).to.have.property('visibility', 'hidden')
  })
})
