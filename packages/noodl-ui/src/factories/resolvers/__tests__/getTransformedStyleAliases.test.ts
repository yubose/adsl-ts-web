import { expect } from 'chai'
import { makeResolverTest } from '../../utils/test-utils'
import getTransformedStyleAliases from '../getTransformedStyleAliases'

let _getTransformedStyleAliases: any

beforeEach(() => {
  _getTransformedStyleAliases = makeResolverTest({
    resolvers: getTransformedStyleAliases,
  })
})

describe('getTransformedStyleAliases', () => {
  it('should turn visibility to hidden if "isHidden" is true', () => {
    expect(
      _getTransformedStyleAliases({ style: { isHidden: true } }).style,
    ).to.have.property('visibility', 'hidden')
  })
})
