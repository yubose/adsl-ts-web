import { expect } from 'chai'
import Viewport from '../Viewport'

let viewport: Viewport

beforeEach(() => {
  viewport = new Viewport({ width: 375, height: 667 })
})

describe(`Viewport`, () => {
  describe(`getSize`, () => {
    it(`should return "0px" if value is a string "0"`, () => {
      expect(Viewport.getSize('0', 300, { unit: 'px' })).to.eq('0px')
    })

    it(`should return the full size by viewport if value is a string "1"`, () => {
      expect(Viewport.getSize('1', 2500, { unit: 'px' })).to.eq('2500px')
    })

    describe(`when the value is a string`, () => {
      it(
        `should just return the value back untouched assuming it is already ` +
          `suffixed with their unit if the value is a string and has a letter`,
        () =>
          expect(Viewport.getSize('20px', 300000, { unit: 'px' })).to.eq(
            '20px',
          ),
      )

      it(
        `should return the size in px when the value does not have a letter by ` +
          `multiplying by their corresponding viewport size if it is in decimal form`,
        () =>
          expect(Viewport.getSize('0.2', 500, { unit: 'px' })).to.eq('100px'),
      )

      it(`should return the correct size in px when it doesn't have a letter`, () => {
        expect(Viewport.getSize('1', 500, { unit: 'px' })).to.eq('500px')
      })

      it(
        `should return the correct size in px when the value is a string ` +
          `representing a number greater than "1"`,
        () =>
          expect(Viewport.getSize('2', 500, { unit: 'px' })).to.eq('1000px'),
      )
    })

    describe(`when the value is a number`, () => {
      it(
        `should return the size in px by multiplying by their corresponding ` +
          `viewport size if it is in decimal form`,
        () =>
          expect(Viewport.getSize('2', 500, { unit: 'px' })).to.eq('1000px'),
      )

      it(`should return the correct size in px`, () => {
        expect(Viewport.getSize('2', 500, { unit: 'px' })).to.eq('1000px')
      })
    })
  })

  describe(`getWidth/getHeight`, () => {
    it(
      `should return the width calculated from the viewport using the ` +
        `value provided in args`,
      () => {
        const width = '0.5'
        const height = '0.8'
        expect(viewport.getWidth(width)).to.eq(187.5)
        expect(viewport.getHeight(height)).to.eq(533.6)
      },
    )
  })
})
