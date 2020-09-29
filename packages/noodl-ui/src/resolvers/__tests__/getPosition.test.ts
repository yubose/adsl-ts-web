import { expect } from 'chai'
import { makeResolverTest } from '../../utils/test-utils'

let resolve: any

beforeEach(() => {
  resolve = makeResolverTest()
})

describe('getPosition', () => {
  it('should get correct results for "0"', () => {
    let result = resolve({ style: { top: '0' } })
    expect(result.style).to.have.property('top', '0px')

    result = resolve({ style: { left: '0' } })
    expect(result.style).to.have.property('left', '0px')
  })

  it('should get correct results for "1"', () => {
    let result = resolve({ style: { top: '1' } })
    expect(result.style).to.have.property('top', '667px')

    result = resolve({ style: { left: '1' } })
    expect(result.style).to.have.property('left', '375px')
  })

  it('should get correct results for decimal strings like "0.23"', () => {
    let result = resolve({ style: { top: '0.23' } })
    expect(result.style).to.have.property('top', '153.41px')

    result = resolve({ style: { left: '0.89' } })
    expect(result.style).to.have.property('left', '333.75px')
  })
})
