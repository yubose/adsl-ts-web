import { expect } from 'chai'
import { makeResolverTest } from '../../utils/test-utils'
import getSizes from '../getSizes'

let _getSizes: any

beforeEach(() => {
  _getSizes = makeResolverTest({ resolvers: getSizes })
})

describe('getSizes', () => {
  // '0.45' --> '168.75px'
  it('should return the string decimal as px', () => {
    let result = _getSizes({ style: { width: '0.45' } })
    expect(result.style).to.have.property('width', '168.75px')

    result = _getSizes({ style: { height: '0.29' } })
    expect(result.style).to.have.property('height', '193.42999999999998px')
  })

  // '23px' --> '23px'
  it('should return the same value if px was already appended', () => {
    const style = { width: '23px', height: '0.27px' }
    const result = _getSizes({ style })
    expect(result.style).to.have.property('width', '23px')
    expect(result.style).to.have.property('height', '0.27px')
  })

  // '0' --> 0
  it('should return a value of 0 and append px to it', () => {
    const style = { width: '0', height: '0' }
    const result = _getSizes({ style })
    expect(result.style.width).to.equal('0px')
    expect(result.style.height).to.equal('0px')
  })

  // '1' --> 375px
  it('should just return the viewport size with px appended if value is "1"', () => {
    const style = { width: '1', height: '1' }
    const result = _getSizes({ style })
    expect(result.style.width).to.equal('375px')
    expect(result.style.height).to.equal('667px')
  })

  // TODO: come back to this
  // '12' --> '12px'
  it('should append px for now (NOTE: come back to this)', () => {
    const result = _getSizes({ style: { width: '12', height: '2' } })
    expect(result.style.width).to.equal('12px')
    expect(result.style.height).to.equal('2px')
  })

  // 1 --> '375px'
  it('should return the the size with px appended if value is a number 1', () => {
    let result = _getSizes({ style: { width: 1 } })
    expect(result.style.width).to.equal('375px')
    result = _getSizes({ style: { height: 1 } })
    expect(result.style.height).to.equal('667px')
  })

  // 0 --> '0px'
  it('should keep it at 0 but convert to string and append px', () => {
    const result = _getSizes({ style: { width: 0, height: 0 } })
    expect(result.style.width).to.equal('0px')
    expect(result.style.height).to.equal('0px')
  })

  // 35 --> 35px
  it('should return the value with px appended', () => {
    const result = _getSizes({ style: { width: 38, height: 203 } })
    expect(result.style.width).to.equal('38px')
    expect(result.style.height).to.equal('203px')
  })

  // 0.45 --> '168.75px'
  it('should treat 0.45 as "0.45" (divide by total viewport size)', () => {
    const result = _getSizes({ style: { width: 0.45, height: 0.23 } })
    expect(result.style.width).to.equal('168.75px')
    expect(result.style.height).to.equal('153.41px')
  })
})
