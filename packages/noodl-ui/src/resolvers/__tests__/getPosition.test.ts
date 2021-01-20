import { expect } from 'chai'
import { createResolverTest } from '../../utils/test-utils'
import _getPosition from '../getPosition'

let getPosition: any

beforeEach(() => {
  getPosition = createResolverTest(_getPosition)
})

describe('getPosition', () => {
  it('should get correct results for "0"', () => {
    let result = getPosition({ style: { top: '0' } })
    expect(result.style).to.have.property('top', '0px')

    result = getPosition({ style: { left: '0' } })
    expect(result.style).to.have.property('left', '0px')
  })

  it('should get correct results for "1"', () => {
    let result = getPosition({ style: { top: '1' } })
    expect(result.style).to.have.property('top', '667px')

    result = getPosition({ style: { left: '1' } })
    expect(result.style).to.have.property('left', '375px')
  })

  it('should get correct results for decimal strings like "0.23"', () => {
    let result = getPosition({ style: { top: '0.23' } })
    expect(result.style).to.have.property('top', '153.41px')

    result = getPosition({ style: { left: '0.89' } })
    expect(result.style).to.have.property('left', '333.75px')
  })
})
