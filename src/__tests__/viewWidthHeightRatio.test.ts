import chalk from 'chalk'
import { expect } from 'chai'
import { Viewport } from 'noodl-ui'
import { getAspectRatio } from '../utils/common'
import { deviceSize } from '../utils/test-utils'
import getViewportSizeWithMinMax from '../utils/getViewportSizeWithMinMax'

let viewWidthHeightMinMax = { min: 0.7, max: 1.5 } as { min: any; max: any }
let viewport: Viewport

beforeEach(() => {
  viewport = new Viewport()
})

describe('viewWidthHeightMinMax', () => {
  describe(
    `when the user\'s aspect ratio is less than the ` +
      `${chalk.yellow('min')}`,
    () => {
      it(`should calculate the width using ${chalk.white(
        'min * height',
      )}`, () => {
        viewport.width = deviceSize.galaxys5.width
        viewport.height = deviceSize.galaxys5.height
        expect(
          getViewportSizeWithMinMax({
            ...deviceSize.galaxys5,
            ...viewWidthHeightMinMax,
            aspectRatio: getAspectRatio(
              deviceSize.galaxys5.width,
              deviceSize.galaxys5.height,
            ),
          }).width,
        ).to.eq(viewWidthHeightMinMax.min * deviceSize.galaxys5.height)
      })
      xit(`should be able to scroll left and right`, () => {
        //
      })
    },
  )

  describe(
    `when the user\'s aspect ratio is larger than the ` +
      `${chalk.yellow('max')} ratio`,
    () => {
      it.only(`should calculate the width using ${chalk.white(
        'max * viewport height',
      )}`, () => {
        viewport.width = deviceSize.widescreen.width
        viewport.height = deviceSize.widescreen.height
        expect(
          getViewportSizeWithMinMax({
            ...deviceSize.widescreen,
            ...viewWidthHeightMinMax,

            aspectRatio: getAspectRatio(
              deviceSize.widescreen.width,
              deviceSize.widescreen.height,
            ),
          }).width,
        ).to.eq(viewWidthHeightMinMax.max * deviceSize.widescreen.height)
      })

      // NOTE - This should leave the left and right sides blank
      xit(`should set the user's view to the center`, () => {
        //
      })
    },
  )
})
