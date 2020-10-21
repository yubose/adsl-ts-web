import { expect } from 'chai'
import { makeResolverTest } from '../../utils/test-utils'

let resolve: any

beforeEach(() => {
  resolve = makeResolverTest()
})

describe('getCustomDataAttrs', () => {
  it('should attach the data attribute for contentType: passwordHidden components and its value as passwordHidden', () => {
    expect(resolve({ contentType: 'passwordHidden' })).to.have.property(
      'data-ux',
      'passwordHidden',
    )
  })

  it('should attach the data attribute for popUp components and use viewTag as the value', () => {
    expect(resolve({ type: 'popUp', viewTag: 'apple' })).to.have.property(
      'data-ux',
      'apple',
    )
  })

  it('should attach data-listid and data-listdata for list components', () => {
    const listData = [{ george: 'what' }]
    const result = resolve({
      type: 'list',
      id: 'abc123',
      listObject: listData,
    })
    expect(result).to.have.property('data-listid', 'abc123')
    expect(result).to.have.deep.property('data-listdata', listData)
  })

  xit('should attach the data-value value from an itemObject component for dates', () => {
    const result = resolve({
      type: 'list',
      id: 'abc123',
      'text=func': () => {},
    })
  })

  it('should attach the data-name prop for components that have a dataKey', () => {
    const result = resolve({
      type: 'list',
      id: 'abc123',
      dataKey: 'hehe',
    })
    expect(result).to.have.property('data-name')
  })
})
