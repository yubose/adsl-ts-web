import { expect } from 'chai'
import Viewport from '../../Viewport'

let viewport: Viewport

beforeEach(() => {
  viewport = new Viewport({ width: 375, height: 667 })
})

describe(`getSizes`, () => {
  describe(`when parent has both top and height`, () => {
    describe(`parent: { width: "0.2", height: "0.5" }`, () => {
      const parentDims = { width: '0.2', height: '0.5' }

      xit(`should calculate the child's dimensions correctly`, () => {
        const viewport = { width: 375, height: 667 }
        const child = { width: '0.4', height: '0.2' }
        expect(Viewport.getSize(child.width, viewport.width)).to.eq(75)
      })
    })
  })

  describe(`when parent is missing top`, () => {
    xit(``, () => {
      //
    })
  })

  describe(`when parent is missing height`, () => {
    xit(``, () => {
      //
    })
  })

  describe(`when child is missing top`, () => {
    xit(``, () => {
      //
    })
  })

  describe(`when child is missing height`, () => {
    xit(``, () => {
      //
    })
  })

  describe(`when both parent and child are missing top and height`, () => {
    xit(``, () => {
      //
    })
  })
})
