import { expect } from 'chai'
import { Draft } from 'immer'
import { createResolverTest } from '../../utils/test-utils'
import { ComponentObject } from '../../types'
import _getAlignAttrs from '../getAlignAttrs'

let component: Draft<ComponentObject>
let getAlignAttrs: any

beforeEach(() => {
  getAlignAttrs = createResolverTest(_getAlignAttrs)
  component = {
    type: 'view',
    style: {
      border: { style: '2' },
      fontStyle: 'bold',
      textAlign: 'centerX',
    },
  }
})

describe('getAlignAttrs', () => {
  it('should return correct attrs for textAlign: "centerX"', () => {
    const result = getAlignAttrs(component)
    expect(result.style.textAlign).to.eq('center')
  })

  it('should return correct attrs for textAlign: "centerY"', () => {
    component.style.textAlign = 'centerY'
    const result = getAlignAttrs(component)
    expect(result.style).to.have.property('display', 'flex')
    expect(result.style).to.have.property('alignItems', 'center')
    expect(result.style).not.to.have.property('textAlign')
  })

  it('should return correct attrs for native textAlign values', () => {
    component.style.textAlign = 'left'
    let result = getAlignAttrs(component)
    expect(result.style.textAlign).to.equal('left')
    component.style.textAlign = 'center'
    result = getAlignAttrs(component)
    expect(result.style.textAlign).to.equal('center')
    component.style.textAlign = 'right'
    result = getAlignAttrs(component)
    expect(result.style.textAlign).to.equal('right')
  })

  it('should return the correct attrs for { x: "left", y: "center" }', () => {
    component.style.textAlign = { x: 'left', y: 'center' }
    const result = getAlignAttrs(component)
    expect(result.style.textAlign).to.equal('left')
    expect(result.style).to.have.property('display', 'flex')
    expect(result.style).to.have.property('alignItems', 'center')
  })

  it('should return the correct attrs for { x: "center", y: "center" }', () => {
    component.style.textAlign = { x: 'center', y: 'center' }
    const result = getAlignAttrs(component)
    expect(result.style).to.have.property('textAlign', 'center')
    expect(result.style).to.have.property('display', 'flex')
    expect(result.style).to.have.property('alignItems', 'center')
  })

  it('should return the correct attrs for { x: "left" }', () => {
    component.style.textAlign = { x: 'left' }
    expect(getAlignAttrs(component).style).to.have.property('textAlign', 'left')
  })

  it('should return the correct attrs for { y: "center" }', () => {
    component.style.textAlign = { y: 'center' }
    const result = getAlignAttrs(component)
    expect(result.style).to.have.property('display', 'flex')
    expect(result.style).to.have.property('alignItems', 'center')
  })

  it('should return { display: "inline" }', () => {
    component.style.display = 'inline'
    expect(getAlignAttrs(component).style).to.have.property('display', 'inline')
  })
})
