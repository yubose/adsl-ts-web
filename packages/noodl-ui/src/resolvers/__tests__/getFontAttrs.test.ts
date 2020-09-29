import { expect } from 'chai'
import { makeResolverTest } from '../../utils/test-utils'

let resolve: any

beforeEach(() => {
  resolve = makeResolverTest()
})

describe('getFontAttrs', () => {
  it('should always append the px unit', () => {
    let result = resolve({ style: { fontSize: '14' } })
    expect(result.style).to.have.property('fontSize', '14px')

    result = resolve({ style: { fontSize: '10' } })
    expect(result.style).to.have.property('fontSize', '10px')

    result = resolve({ style: { fontSize: 10 } })
    expect(result.style).to.have.property('fontSize', '10px')

    result = resolve({ style: { fontSize: 0 } })
    expect(result.style).to.have.property('fontSize', '0px')
  })

  it('should return a fontWeight with bold if fontStyle was bold', () => {
    const result = resolve({ style: { fontStyle: 'bold' } })
    expect(result.style).to.have.property('fontWeight', 'bold')
    expect(result.style).not.to.have.property('fontStyle')
  })
})
