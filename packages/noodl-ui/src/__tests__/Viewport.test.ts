import { expect } from 'chai'
import { noodlui } from '../utils/test-utils'
import Viewport from '../Viewport'

describe(`Viewport`, () => {
  describe(`getSize`, () => {
    it(`should return "0px" if value is a string "0"`, () => {
      const viewport = new Viewport({ width: 375, height: 667 })
      expect(Viewport.getSize('0', 300, { unit: 'px' })).to.eq('0px')
    })

    it(`should return the full size by viewport if value is a string "1"`, () => {
      const viewport = new Viewport({ width: 375, height: 667 })
      expect(Viewport.getSize('1', 2500, { unit: 'px' })).to.eq('2500px')
    })

    describe(`when the value is a string`, () => {
      it(
        `should just return the value back untouched assuming it is already ` +
          `suffixed with their unit if the value is a string and has a letter`,
        () => {
          const viewport = new Viewport({ width: 375, height: 667 })
          expect(Viewport.getSize('20px', 300000, { unit: 'px' })).to.eq('20px')
        },
      )

      it(
        `should return the size in px when the value does not have a letter by ` +
          `multiplying by their corresponding viewport size if it is in decimal form`,
        () => {
          const viewport = new Viewport({ width: 375, height: 667 })
          expect(Viewport.getSize('0.2', 500, { unit: 'px' })).to.eq('100px')
        },
      )

      it(`should return the correct size in px when it doesn't have a letter`, () => {
        const viewport = new Viewport({ width: 375, height: 667 })
        expect(Viewport.getSize('1', 500, { unit: 'px' })).to.eq('500px')
      })

      it(
        `should return the correct size in px when the value is a string ` +
          `representing a number greater than "1"`,
        () => {
          const viewport = new Viewport({ width: 375, height: 667 })
          expect(Viewport.getSize('2', 500, { unit: 'px' })).to.eq('1000px')
        },
      )
    })

    describe(`when the value is a number`, () => {
      it(
        `should return the size in px by multiplying by their corresponding ` +
          `viewport size if it is in decimal form`,
        () => {
          const viewport = new Viewport({ width: 375, height: 667 })
          expect(Viewport.getSize('2', 500, { unit: 'px' })).to.eq('1000px')
        },
      )

      it(`should return the correct size in px`, () => {
        const viewport = new Viewport({ width: 375, height: 667 })
        expect(Viewport.getSize('2', 500, { unit: 'px' })).to.eq('1000px')
      })
    })
  })

  describe(`getWidth/getHeight`, () => {
    it(
      `should return the width calculated from the viewport using the ` +
        `value provided in args`,
      () => {
        const viewport = new Viewport({ width: 375, height: 667 })
        const width = '0.5'
        const height = '0.8'
        expect(viewport.getWidth(width)).to.eq(187.5)
        expect(viewport.getHeight(height)).to.eq(533.6)
      },
    )
  })

  describe(`positioning from parent/child ancestry`, () => {
    it.only(`should return the font size size`, () => {
      const getLineSpacing = (v: number) => v * 1.5
      const getLetterSpacing = (v: number) => v * 0.12
      const getSpacing = (v: number) => v * 2
      const getWordSpacing = (v: number) => v * 0.16
      const fontSize = 14
      const dims = {
        lineSpacing: getLineSpacing(fontSize),
        letterSpacing: getLetterSpacing(fontSize),
        spacing: getSpacing(fontSize),
        wordSpacing: getWordSpacing(fontSize),
      }
      console.log(dims)
      // expect(Viewport.getSize(child.width, viewport.width)).to.eq(75)
    })

    describe(`when parent has both top and height`, () => {
      describe(`parent: { width: "0.2", height: "0.5" }`, () => {
        const parentDims = { width: '0.2', height: '0.5' }

        it(`should calculate the child's dimensions correctly`, () => {
          const viewport = { width: 375, height: 667 }
          const child = { width: '0.4', height: '0.2' }
          expect(Viewport.getSize(child.width, viewport.width)).to.eq(75)
        })
      })
    })
  })
})
