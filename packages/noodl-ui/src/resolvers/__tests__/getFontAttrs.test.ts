import { expect } from 'chai'
import { createResolverTest } from '../../utils/test-utils'
import _getFontAttrs from '../getFontAttrs'

let getFontAttrs: any

beforeEach(() => {
  getFontAttrs = createResolverTest(_getFontAttrs)
})

describe('getFontAttrs', () => {
  it('should always append the px unit', () => {
    let result = getFontAttrs({ style: { fontSize: '14' } })
    expect(result.style).to.have.property('fontSize', '14px')

    result = getFontAttrs({ style: { fontSize: '10' } })
    expect(result.style).to.have.property('fontSize', '10px')

    result = getFontAttrs({ style: { fontSize: 10 } })
    expect(result.style).to.have.property('fontSize', '10px')

    result = getFontAttrs({ style: { fontSize: 0 } })
    expect(result.style).to.have.property('fontSize', '0px')
  })

  it('should return a fontWeight with bold if fontStyle was bold', () => {
    const result = getFontAttrs({ style: { fontStyle: 'bold' } })
    expect(result.style).to.have.property('fontWeight', 'bold')
    expect(result.style).not.to.have.property('fontStyle')
  })
})
