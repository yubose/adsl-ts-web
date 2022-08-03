import chalk from 'chalk'
import { expect } from 'chai'
import { coolGold, italic } from 'noodl-common'
import { Viewport as VP } from 'noodl-ui'
import { deviceSize, viewport } from '../utils/test-utils'
import createViewportHandler, {
  getViewportSizeWithMinMax,
} from '../handlers/viewport'

let viewWidthHeightMinMax = { min: 0.7, max: 1.5 } as { min: any; max: any }
let viewportHandler: ReturnType<typeof createViewportHandler>
let originalWidth: number
let originalHeight: number

beforeEach(() => {
  originalWidth = window.innerWidth
  originalHeight = window.innerHeight
  Object.assign(window, {
    innerWidth: 375,
    innerHeight: 667,
  })
  viewportHandler = createViewportHandler(viewport)
  viewportHandler
    .setMinAspectRatio(viewWidthHeightMinMax.min)
    .setMaxAspectRatio(viewWidthHeightMinMax.max)
    .setViewportSize({
      width: 375,
      height: 667,
    })
})

afterEach(() => {
  Object.assign(window, {
    innerWidth: originalWidth,
    innerHeight: originalHeight,
  })
})

describe(coolGold(`viewport`), () => {
  describe(italic(`viewWidthHeightMinMax`), () => {
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
              aspectRatio: VP.getAspectRatio(
                deviceSize.galaxys5.width,
                deviceSize.galaxys5.height,
              ),
            }).width,
          ).to.eq(viewWidthHeightMinMax.min * deviceSize.galaxys5.height)
        })
      },
    )

    describe(
      `when the user\'s aspect ratio is larger than the ` +
        `${chalk.yellow('max')} ratio`,
      () => {
        it(`should calculate the width using ${chalk.white(
          'max * viewport height',
        )}`, () => {
          viewport.width = deviceSize.widescreen.width
          viewport.height = deviceSize.widescreen.height
          expect(
            getViewportSizeWithMinMax({
              ...deviceSize.widescreen,
              ...viewWidthHeightMinMax,

              aspectRatio: VP.getAspectRatio(
                deviceSize.widescreen.width,
                deviceSize.widescreen.height,
              ),
            }).width,
          ).to.eq(viewWidthHeightMinMax.max * deviceSize.widescreen.height)
        })
      },
    )
  })
})
