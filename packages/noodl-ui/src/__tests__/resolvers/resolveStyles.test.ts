import * as mock from 'noodl-ui-test-utils'
import { expect } from 'chai'
import { coolGold, italic, magenta } from 'noodl-common'
import { ComponentObject } from 'noodl-types'
import { presets } from '../../constants'
import NUI from '../../noodl-ui'

function resolveComponent(component: ComponentObject) {
  const page = NUI.createPage({
    name: 'Hello',
    viewport: { width: 375, height: 667 },
  })
  return NUI.resolveComponents({ components: component, page })
}

describe(coolGold(`resolveStyles (ComponentResolver)`), () => {
  describe(italic(`Alignment`), () => {
    describe(`axis`, () => {
      it(
        `should change { axis: "horizontal" } to ` +
          `{ display: 'flex', flexWrap: 'nowrap' }`,
        () => {
          expect(
            resolveComponent(
              mock.getButtonComponent({ style: { axis: 'horizontal' } }),
            ).style,
          ).to.satisfy(
            (style: any) =>
              style.display === 'flex' && style.flexWrap === 'nowrap',
          )
        },
      )

      it(
        `should change { axis: 'vertical' } to ` +
          `{ display: 'flex', flexDirection: 'column' }`,
        () => {
          expect(
            resolveComponent(
              mock.getButtonComponent({ style: { axis: 'vertical' } }),
            ).style,
          ).to.satisfy(
            (style: any) =>
              style.display === 'flex' && style.flexDirection === 'column',
          )
        },
      )

      it(`should remove the property after being consumed`, () => {
        expect(
          resolveComponent(
            mock.getButtonComponent({ style: { axis: 'vertical' } }),
          ).style,
        ).not.to.have.property('axis')
      })
    })

    const leftCenterRightKeys = ['left', 'center', 'right'] as const

    it(`should change { textAlign: 'centerX' } to { textAlign: 'center' }`, () => {
      const component = resolveComponent(
        mock.getButtonComponent({ style: { textAlign: 'centerX' } }),
      )
      expect(component.style).to.have.property('textAlign', 'center')
    })

    describe(`{ textAlign: 'centerY' }`, () => {
      it(`should change to { display: 'flex', alignItems: 'center' }`, () => {
        expect(
          resolveComponent(
            mock.getButtonComponent({ style: { textAlign: 'centerY' } }),
          ).style,
        ).to.satisfy(
          (style: any) =>
            style.display === 'flex' && style.alignItems === 'center',
        )
      })

      it(`should delete the textAlign property`, () => {
        expect(
          resolveComponent(
            mock.getButtonComponent({ style: { textAlign: 'centerY' } }),
          ).style,
        ).not.to.have.property('textAlign')
      })
    })

    leftCenterRightKeys.forEach((key) => {
      it(`should change { textAlign: '${key}' } to { textAlign: '${key}' }`, () => {
        expect(
          resolveComponent(
            mock.getButtonComponent({ style: { textAlign: key as any } }),
          ).style,
        )
          .to.have.property('textAlign')
          .eq(key)
      })
    })

    it(`should change { textAlign: { x: 'left' } } to { textAlign: 'left' }`, () => {
      expect(
        resolveComponent(
          mock.getButtonComponent({ style: { textAlign: { x: 'left' } } }),
        ).style,
      )
        .to.have.property('textAlign')
        .eq('left')
    })

    // @ts-expect-error
    leftCenterRightKeys
      .concat(['centerX'])
      .forEach((key: typeof leftCenterRightKeys[number] | 'centerX') => {
        it(
          `should change { textAlign: { x: '${key}', y: 'center' } } to ` +
            `{ textAlign: '${key}', display:'flex', alignItems: 'center }`,
          () => {
            const { style } = resolveComponent(
              mock.getButtonComponent({
                style: { textAlign: { x: key, y: 'center' } },
              }),
            )
            if (key === 'left') {
              expect(style).to.have.property('textAlign', 'left')
              expect(style).to.have.property('display', 'flex')
              expect(style).to.have.property('alignItems', 'center')
            } else if (key === 'center' || key === 'centerX') {
              expect(style).to.have.property('textAlign', 'center')
              expect(style).to.have.property('display', 'flex')
              expect(style).to.have.property('alignItems', 'center')
            } else {
              expect(style).to.have.property('textAlign', 'right')
              expect(style).to.have.property('display', 'flex')
              expect(style).to.have.property('alignItems', 'center')
            }
          },
        )
      })
  })

  describe(italic(`Border`), () => {
    Object.keys(presets.border).forEach((borderPresetKey) => {
      it(`should apply the styles from the border preset "${borderPresetKey}"`, () => {
        expect(
          resolveComponent(
            mock.getTextFieldComponent({
              style: { border: borderPresetKey as any },
            }),
          ).style,
        ).to.satisfy((style: any) =>
          Object.entries(style).every(([k, v]) => style[k] === v),
        )
      })
    })

    it(`should format the borderColor to hex format`, () => {
      expect(
        resolveComponent(
          mock.getTextFieldComponent({
            style: { border: { color: '0x33004433' } },
          }),
        ).style,
      ).to.have.property('borderColor', '#33004433')
    })

    it(`should set the borderStyle to the value of border.line`, () => {
      expect(
        resolveComponent(
          mock.getTextFieldComponent({
            style: { border: { line: 'thin' } },
          }),
        ).style,
      ).to.have.property('borderStyle', 'thin')
    })

    it(`should set the borderWidth to the value of border.width`, () => {
      expect(
        resolveComponent(
          mock.getTextFieldComponent({
            style: { border: { width: 'thin' } },
          }),
        ).style,
      ).to.have.property('borderWidth', 'thin')
    })

    it('should attach px if borderRadius is a number string with no unit', () => {
      let result = resolveComponent(
        mock.getTextFieldComponent({ style: { borderRadius: '0' } }),
      )
      expect(result.style.borderRadius).to.eq('0px')
      result = resolveComponent(
        mock.getTextFieldComponent({ style: { borderRadius: '12' } }),
      )
      expect(result.style.borderRadius).to.eq('12px')
    })

    it('should attach px if borderWidth is a number string with no unit', () => {
      let result = resolveComponent(
        mock.getTextFieldComponent({ style: { borderWidth: '0' } }),
      )
      expect(result.style.borderWidth).to.eq('0px')
      result = resolveComponent(
        mock.getTextFieldComponent({ style: { borderWidth: '12' } }),
      )
      expect(result.style.borderWidth).to.eq('12px')
    })
  })

  describe(italic(`Color`), () => {
    it('should rename textColor to color and remove textColor', () => {
      const result = resolveComponent(
        mock.getViewComponent({
          style: { textColor: '0x33445566' },
        }),
      )
      expect(result.style).to.have.property('color', '#33445566')
      expect(result.style).not.to.have.property('textColor')
    })

    it('should format color values like 0x000000 to #000000 from any property', () => {
      const style = {
        abc: '0x33210299',
        hello: '0x33210299',
        qqqqqq: '0x33210299',
        textColor: '0x33210299',
        backgroundColor: '0x33210299',
        background: '0x33210299',
        borderColor: '0x33210299',
      }
      const result = resolveComponent(mock.getViewComponent({ style }))
      expect(result.style?.abc).to.eq('#33210299')
      Object.keys(style).forEach((k) => {
        if (k !== 'textColor') {
          expect(result.style).to.have.property(k, '#33210299')
        }
      })
    })

    xit(`should format color data values coming from list data objects`, () => {
      //
    })
  })

  describe(italic(`Display`), () => {
    it(`should always keep { display: 'inline' } if it was provided`, () => {
      expect(
        mock.getButtonComponent({ style: { display: 'inline' } }).style,
      ).to.have.property('display', 'inline')
    })
  })

  describe(italic(`Font`), () => {
    it(`should always append px`, () => {
      let result = resolveComponent(
        mock.getScrollViewComponent({ style: { fontSize: '14' } }),
      )
      expect(result.style).to.have.property('fontSize', '14px')
      result = resolveComponent(
        mock.getScrollViewComponent({ style: { fontSize: '10' } }),
      )
      expect(result.style).to.have.property('fontSize', '10px')
      result = resolveComponent(
        mock.getScrollViewComponent({ style: { fontSize: 10 } as any }),
      )
      expect(result.style).to.have.property('fontSize', '10px')
      result = resolveComponent(
        mock.getScrollViewComponent({ style: { fontSize: 0 } as any }),
      )
      expect(result.style).to.have.property('fontSize', '0px')
    })

    it('should return a fontWeight with bold if fontStyle was bold', () => {
      const result = resolveComponent(
        mock.getScrollViewComponent({ style: { fontStyle: 'bold' } }),
      )
      expect(result.style).to.have.property('fontWeight', 'bold')
      expect(result.style).not.to.have.property('fontStyle')
    })
  })

  describe(italic(`Positioning`), () => {
    it('should append the unit if missing', () => {
      let result = resolveComponent(
        mock.getVideoComponent({ style: { top: '0' } }),
      )
      expect(result.style).to.have.property('top', '0px')
      result = resolveComponent(
        mock.getVideoComponent({ style: { left: '0' } }),
      )
      expect(result.style).to.have.property('left', '0px')
    })

    it('should change to "667px" for top and "375px" for left', () => {
      let result = resolveComponent(
        mock.getVideoComponent({ style: { top: '1' } }),
      )
      expect(result.style).to.have.property('top', '667px')
      result = resolveComponent(
        mock.getVideoComponent({ style: { left: '1' } }),
      )
      expect(result.style).to.have.property('left', '375px')
    })

    it('should get correct results for decimal strings like "0.23"', () => {
      let result = resolveComponent(
        mock.getVideoComponent({ style: { top: '0.23' } }),
      )
      expect(result.style).to.have.property('top', '153.41px')
      result = resolveComponent(
        mock.getVideoComponent({ style: { left: '0.89' } }),
      )
      expect(result.style).to.have.property('left', '333.75px')
    })
  })

  describe(italic(`Sizes`), () => {
    // '0.45' --> '168.75px'
    it('should return the string decimal as px', () => {
      let result = resolveComponent(
        mock.getSelectComponent({ style: { width: '0.45' } }),
      )
      expect(result.style).to.have.property('width', '168.75px')

      result = resolveComponent(
        mock.getSelectComponent({ style: { height: '0.29' } }),
      )
      expect(result.style).to.have.property('height', '193.42999999999998px')
    })

    // '23px' --> '23px'
    it('should return the same value if px was already appended', () => {
      const style = { width: '23px', height: '0.27px' }
      const result = resolveComponent(mock.getSelectComponent({ style }))
      expect(result.style).to.have.property('width', '23px')
      expect(result.style).to.have.property('height', '0.27px')
    })

    // '0' --> 0
    it('should return a value of 0 and append px to it', () => {
      const style = { width: '0', height: '0' }
      const result = resolveComponent(mock.getSelectComponent({ style }))
      expect(result.style.width).to.equal('0px')
      expect(result.style.height).to.equal('0px')
    })

    // '1' --> 375px
    it('should just return the viewport size with px appended if value is "1"', () => {
      const style = { width: '1', height: '1' }
      const result = resolveComponent(mock.getSelectComponent({ style }))
      expect(result.style.width).to.equal('375px')
      expect(result.style.height).to.equal('667px')
    })

    // 1 --> '375px'
    it('should return the the size with px appended if value is a number 1', () => {
      let result = resolveComponent(
        mock.getSelectComponent({ style: { width: 1 } as any }),
      )
      expect(result.style.width).to.equal('375px')
      result = resolveComponent(
        mock.getSelectComponent({ style: { height: 1 } as any }),
      )
      expect(result.style.height).to.equal('667px')
    })

    // 0 --> '0px'
    it('should keep it at 0 but convert to string and append px', () => {
      const result = resolveComponent(
        mock.getSelectComponent({ style: { width: 0, height: 0 } as any }),
      )
      expect(result.style.width).to.equal('0px')
      expect(result.style.height).to.equal('0px')
    })

    // 35 --> 35px
    it('should return the value with px appended', () => {
      const result = resolveComponent(
        mock.getSelectComponent({ style: { width: 38, height: 203 } as any }),
      )
      expect(result.style.width).to.equal('38px')
      expect(result.style.height).to.equal('203px')
    })

    // 0.45 --> '168.75px'
    it('should treat 0.45 as "0.45" (divide by total viewport size)', () => {
      const result = resolveComponent(
        mock.getSelectComponent({
          style: { width: 0.45, height: 0.23 } as any,
        }),
      )
      expect(result.style.width).to.equal('168.75px')
      expect(result.style.height).to.equal('153.41px')
    })
  })

  describe(italic(`Visibility`), () => {
    it('should turn visibility to hidden if "isHidden" is true', () => {
      expect(
        resolveComponent(mock.getImageComponent({ style: { isHidden: true } }))
          .style,
      ).to.have.property('visibility', 'hidden')
    })
  })

  describe(italic(`Components`), () => {
    describe(magenta(`header`), () => {
      it(`should set zIndex to 100`, () => {
        expect(
          resolveComponent(mock.getHeaderComponent()).style,
        ).to.have.property('zIndex', 100)
      })
    })

    describe(magenta(`image`), () => {
      it(
        `should remove the "height" if it does not explicitly have ` +
          `a height set to maintain the aspect ratio`,
        () => {
          expect(
            resolveComponent(mock.getImageComponent()).style,
          ).not.to.have.property('height')
        },
      )

      it(`should set objectFit to "contain"`, () => {
        expect(
          resolveComponent(mock.getImageComponent()).style,
        ).to.have.property('objectFit', 'contain')
      })
    })

    describe(magenta(`list`), () => {
      it(`should disable listStyle and padding`, () => {
        expect(resolveComponent(mock.getListComponent()).style).to.satisfy(
          (style: any) => {
            return style.listStyle === 'none' && style.padding === '0px'
          },
        )
      })
    })

    xdescribe(magenta(`listItem`), () => {
      it(`should remove listStyle and set padding to 0`, () => {
        expect(resolveComponent(mock.getListItemComponent()).style).to.satisfy(
          (style: any) => style.listStyle === 'none' && style.padding === '0px',
        )
      })
    })

    describe(magenta(`popUp`), () => {
      it(`should set the visibility to hidden`, () => {
        expect(
          resolveComponent(mock.getPopUpComponent()).style,
        ).to.have.property('visibility', 'hidden')
      })
    })

    describe(magenta(`scrollView`), () => {
      it(`should set the display to "block"`, () => {
        expect(
          resolveComponent(mock.getScrollViewComponent()).style,
        ).to.have.property('display', 'block')
      })
    })

    describe(magenta(`textView`), () => {
      it(`should set the default "rows" to 10`, () => {
        expect(
          resolveComponent(mock.getTextViewComponent()).style,
        ).to.have.property('rows', 10)
      })
    })

    describe(magenta(`video`), () => {
      it(`should set objectFit to "contain"`, () => {
        expect(
          resolveComponent(mock.getVideoComponent()).style,
        ).to.have.property('objectFit', 'contain')
      })
    })
  })
})
