import { expect } from 'chai'
import { makeResolverTest } from '../../utils/test-utils'
import getBorderAttrs from '../getBorderAttrs'

let _getBorderAttrs: any

beforeEach(() => {
  _getBorderAttrs = makeResolverTest({ resolvers: getBorderAttrs })
})

describe('getBorderAttrs', () => {
  it('should return correct attrs if border.style === "1"', () => {
    const result = _getBorderAttrs({ style: { border: { style: '1' } } })
    expect(result.style.borderStyle).to.eq('none')
    expect(result.style.borderRadius).to.eq('0px')
  })

  it('should return correct attrs if border.style === "2"', () => {
    const result = _getBorderAttrs({ style: { border: { style: '2' } } })
    expect(result.style.borderStyle).to.eq('none')
    expect(result.style.borderRadius).to.eq('0px')
    expect(result.style.borderBottomStyle).to.eq('solid')
  })

  it('should return correct attrs if border.style === "3"', () => {
    const result = _getBorderAttrs({ style: { border: { style: '3' } } })
    expect(result.style.borderStyle).to.eq('solid')
    expect(result.style.borderWidth).to.eq('thin')
  })

  it('should return correct attrs if border.style === "4"', () => {
    const result = _getBorderAttrs({ style: { border: { style: '4' } } })
    expect(result.style.borderStyle).to.eq('dashed')
    expect(result.style.borderWidth).to.eq('thin')
    expect(result.style.borderRadius).to.eq('0px')
  })

  it('should return correct attrs if border.style === "5"', () => {
    const result = _getBorderAttrs({ style: { border: { style: '5' } } })
    expect(result.style.borderStyle).to.eq('none')
  })

  it('should attach px if borderRadius is a number string with no unit', () => {
    let result = _getBorderAttrs({ style: { borderRadius: '0' } })
    expect(result.style.borderRadius).to.eq('0px')
    result = _getBorderAttrs({ style: { borderRadius: '12' } })
    expect(result.style.borderRadius).to.eq('12px')
  })

  it('should attach px if borderWidth is a number string with no unit', () => {
    let result = _getBorderAttrs({ style: { borderWidth: '0' } })
    expect(result.style.borderWidth).to.eq('0px')
    result = _getBorderAttrs({ style: { borderWidth: '12' } })
    expect(result.style.borderWidth).to.eq('12px')
  })
})
