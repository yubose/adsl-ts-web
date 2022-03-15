import * as mock from 'noodl-ui-test-utils'
import { expect } from 'chai'
import { coolGold, italic, magenta } from 'noodl-common'
import { ComponentObject } from 'noodl-types'
import { presets } from '../../constants'
import { ui } from '../../utils/test-utils'
import NUI from '../../noodl-ui'
import log from '../../utils/log'

async function resolveComponent(component: ComponentObject) {
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
        async () => {
          expect(
            (
              await resolveComponent(
                ui.button({ style: { axis: 'horizontal' } }),
              )
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
        async () => {
          expect(
            (await resolveComponent(ui.button({ style: { axis: 'vertical' } })))
              .style,
          ).to.satisfy(
            (style: any) =>
              style.display === 'flex' && style.flexDirection === 'column',
          )
        },
      )

      it(`should remove the property after being consumed`, async () => {
        expect(
          (await resolveComponent(ui.button({ style: { axis: 'vertical' } })))
            .style,
        ).not.to.have.property('axis')
      })
    })

    const leftCenterRightKeys = ['left', 'center', 'right'] as const

    it(`should change { textAlign: 'centerX' } to { textAlign: 'center' }`, async () => {
      const component = await resolveComponent(
        ui.button({ style: { textAlign: 'centerX' } }),
      )
      expect(component.style).to.have.property('textAlign', 'center')
    })

    describe(`{ textAlign: 'centerY' }`, () => {
      it(`should change to { display: 'flex', alignItems: 'center' }`, async () => {
        expect(
          (
            await resolveComponent(
              ui.button({ style: { textAlign: 'centerY' } }),
            )
          ).style,
        ).to.satisfy(
          (style: any) =>
            style.display === 'flex' && style.alignItems === 'center',
        )
      })

      it(`should delete the textAlign property`, async () => {
        expect(
          (
            await resolveComponent(
              ui.button({ style: { textAlign: 'centerY' } }),
            )
          ).style,
        ).not.to.have.property('textAlign')
      })
    })

    leftCenterRightKeys.forEach((key) => {
      it(`should change { textAlign: '${key}' } to { textAlign: '${key}' }`, async () => {
        expect(
          (
            await resolveComponent(
              ui.button({ style: { textAlign: key as any } }),
            )
          ).style,
        )
          .to.have.property('textAlign')
          .eq(key)
      })
    })

    it(`should change { textAlign: { x: 'left' } } to { textAlign: 'left' }`, async () => {
      expect(
        (
          await resolveComponent(
            ui.button({ style: { textAlign: { x: 'left' } } }),
          )
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
          async () => {
            const { style } = await resolveComponent(
              ui.button({
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
      it(`should apply the styles from the border preset "${borderPresetKey}"`, async () => {
        expect(
          (
            await resolveComponent(
              ui.textField({
                style: { border: borderPresetKey as any },
              }),
            )
          ).style,
        ).to.satisfy((style: any) =>
          Object.entries(style).every(([k, v]) => style[k] === v),
        )
      })
    })

    it(`should format the borderColor to hex format`, async () => {
      expect(
        (
          await resolveComponent(
            ui.textField({
              style: { border: { color: '0x33004433' } },
            }),
          )
        ).style,
      ).to.have.property('borderColor', '#33004433')
    })

    it(`should set the borderStyle to the value of border.line`, async () => {
      expect(
        (
          await resolveComponent(
            ui.textField({
              style: { border: { line: 'thin' } },
            }),
          )
        ).style,
      ).to.have.property('borderStyle', 'thin')
    })

    it(`should set the borderWidth to the value of border.width`, async () => {
      expect(
        (
          await resolveComponent(
            ui.textField({
              style: { border: { width: 'thin' } },
            }),
          )
        ).style,
      ).to.have.property('borderWidth', 'thin')
    })

    it('should attach px if borderRadius is a number string with no unit', async () => {
      let result = await resolveComponent(
        ui.textField({ style: { borderRadius: '0' } }),
      )
      expect(result.style.borderRadius).to.eq('0px')
      result = await resolveComponent(
        ui.textField({ style: { borderRadius: '12' } }),
      )
      expect(result.style.borderRadius).to.eq('12px')
    })

    it('should attach px if borderWidth is a number string with no unit', async () => {
      let result = await resolveComponent(
        ui.textField({ style: { borderWidth: '0' } }),
      )
      expect(result.style.borderWidth).to.eq('0px')
      result = await resolveComponent(
        ui.textField({ style: { borderWidth: '12' } }),
      )
      expect(result.style.borderWidth).to.eq('12px')
    })
  })

  describe(italic(`Color`), () => {
    it('should rename textColor to color and remove textColor', async () => {
      const result = await resolveComponent(
        ui.view({
          style: { textColor: '0x33445566' },
        }),
      )
      expect(result.style).to.have.property('color', '#33445566')
      expect(result.style).not.to.have.property('textColor')
    })

    it('should format color values like 0x000000 to #000000 from any property', async () => {
      const style = {
        abc: '0x33210299',
        hello: '0x33210299',
        qqqqqq: '0x33210299',
        textColor: '0x33210299',
        backgroundColor: '0x33210299',
        background: '0x33210299',
        borderColor: '0x33210299',
      }
      const result = await resolveComponent(ui.view({ style }))
      expect(result.style?.abc).to.eq('#33210299')
      Object.keys(style).forEach((k) => {
        if (k !== 'textColor') {
          expect(result.style).to.have.property(k, '#33210299')
        }
      })
    })
  })

  describe(italic(`Display`), () => {
    it(`should always keep { display: 'inline' } if it was provided`, () => {
      expect(
        ui.button({ style: { display: 'inline' } }).style,
      ).to.have.property('display', 'inline')
    })
  })

  describe(italic(`Font`), () => {
    it(`should always append px`, async () => {
      let result = await resolveComponent(
        ui.scrollView({ style: { fontSize: '14' } }),
      )
      expect(result.style).to.have.property('fontSize', '14px')
      result = await resolveComponent(
        ui.scrollView({ style: { fontSize: '10' } }),
      )
      expect(result.style).to.have.property('fontSize', '10px')
      result = await resolveComponent(
        ui.scrollView({ style: { fontSize: 10 } as any }),
      )
      expect(result.style).to.have.property('fontSize', '10px')
      result = await resolveComponent(
        ui.scrollView({ style: { fontSize: 0 } as any }),
      )
      expect(result.style).to.have.property('fontSize', '0px')
    })

    it('should return a fontWeight with bold if fontStyle was bold', async () => {
      const result = await resolveComponent(
        ui.scrollView({ style: { fontStyle: 'bold' } }),
      )
      expect(result.style).to.have.property('fontWeight', 'bold')
      expect(result.style).not.to.have.property('fontStyle')
    })
  })

  describe(italic(`Positioning`), () => {
    it('should append the unit if missing', async () => {
      let result = await resolveComponent(ui.video({ style: { top: '0' } }))
      expect(result.style).to.have.property('top', '0px')
      result = await resolveComponent(ui.video({ style: { left: '0' } }))
      expect(result.style).to.have.property('left', '0px')
    })

    it('should change to "667px" for top and "375px" for left', async () => {
      let result = await resolveComponent(ui.video({ style: { top: '1' } }))
      expect(result.style).to.have.property('top', '667px')
      result = await resolveComponent(ui.video({ style: { left: '1' } }))
      expect(result.style).to.have.property('left', '375px')
    })

    it('should get correct results for decimal strings like "0.23"', async () => {
      let result = await resolveComponent(ui.video({ style: { top: '0.23' } }))
      expect(result.style).to.have.property('top', '153.41px')
      result = await resolveComponent(ui.video({ style: { left: '0.89' } }))
      expect(result.style).to.have.property('left', '333.75px')
    })
  })

  describe(italic(`Sizes`), () => {
    // '0.45' --> '168.75px'
    it('should return the string decimal as px', async () => {
      let result = await resolveComponent(
        ui.select({ style: { width: '0.45' } }),
      )
      expect(result.style).to.have.property('width', '168.75px')

      result = await resolveComponent(ui.select({ style: { height: '0.29' } }))
      expect(result.style).to.have.property('height', '193.43px')
    })

    // '23px' --> '23px'
    it('should return the same value if px was already appended', async () => {
      const style = { width: '23px', height: '0.27px' }
      const result = await resolveComponent(ui.select({ style }))
      expect(result.style).to.have.property('width', '23px')
      expect(result.style).to.have.property('height', '0.27px')
    })

    // '0' --> 0
    it('should return a value of 0 and append px to it', async () => {
      const style = { width: '0', height: '0' }
      const result = await resolveComponent(ui.select({ style }))
      expect(result.style.width).to.equal('0px')
      expect(result.style.height).to.equal('0px')
    })

    // '1' --> 375px
    it('should just return the viewport size with px appended if value is "1"', async () => {
      const style = { width: '1', height: '1' }
      const result = await resolveComponent(ui.select({ style }))
      expect(result.style.width).to.equal('375px')
      expect(result.style.height).to.equal('667px')
    })

    // 1 --> '375px'
    it('should return the the size with px appended if value is a number 1', async () => {
      let result = await resolveComponent(
        ui.select({ style: { width: 1 } as any }),
      )
      expect(result.style.width).to.equal('375px')
      result = await resolveComponent(
        ui.select({ style: { height: 1 } as any }),
      )
      expect(result.style.height).to.equal('667px')
    })

    // 0 --> '0px'
    it('should keep it at 0 but convert to string and append px', async () => {
      const result = await resolveComponent(
        ui.select({ style: { width: 0, height: 0 } as any }),
      )
      expect(result.style.width).to.equal('0px')
      expect(result.style.height).to.equal('0px')
    })

    // 35 --> 35px
    it('should return the value with px appended', async () => {
      const result = await resolveComponent(
        ui.select({ style: { width: 38, height: 203 } as any }),
      )
      expect(result.style.width).to.equal('38px')
      expect(result.style.height).to.equal('203px')
    })

    // 0.45 --> '168.75px'
    it('should treat 0.45 as "0.45" (divide by total viewport size)', async () => {
      const result = await resolveComponent(
        ui.select({
          style: { width: 0.45, height: 0.23 } as any,
        }),
      )
      expect(result.style.width).to.equal('168.75px')
      expect(result.style.height).to.equal('153.41px')
    })
  })

  describe(italic(`Visibility`), () => {
    it('should turn visibility to hidden if "isHidden" is true', async () => {
      expect(
        (await resolveComponent(ui.image({ style: { isHidden: true } }))).style,
      ).to.have.property('visibility', 'hidden')
    })
  })

  describe(italic(`Components`), () => {
    describe(magenta(`header`), () => {
      it(`should set zIndex to 100`, async () => {
        expect((await resolveComponent(ui.header())).style).to.have.property(
          'zIndex',
          100,
        )
      })
    })

    describe(magenta(`image`), () => {
      it(
        `should remove the "height" if it does not explicitly have ` +
          `a height set to maintain the aspect ratio`,
        async () => {
          expect(
            (await resolveComponent(ui.image())).style,
          ).not.to.have.property('height')
        },
      )

      xit(`should set objectFit to "contain"`, async () => {
        expect((await resolveComponent(ui.image())).style).to.have.property(
          'objectFit',
          'contain',
        )
      })
    })

    describe(magenta(`list`), () => {
      it(`should disable listStyle and padding`, async () => {
        const styles = (await resolveComponent(ui.list())).style
        expect(styles).to.have.property('listStyle', 'none')
        expect(styles).to.have.property('padding', '0px')
      })
    })

    xdescribe(magenta(`listItem`), () => {
      it(`should remove listStyle and set padding to 0`, async () => {
        expect((await resolveComponent(ui.listItem({}))).style).to.satisfy(
          (style: any) => style.listStyle === 'none' && style.padding === '0px',
        )
      })
    })

    describe(magenta('page'), () => {
      it(`should have its styles parsed like others`, async () => {
        const components = await NUI.resolveComponents([
          ui.view({
            style: { shadow: 'true' },
            children: [
              ui.page({
                path: 'Abc',
                style: {
                  shadow: 'true',
                  width: '0.2',
                  top: '0.1',
                },
              }),
            ],
          }),
        ])
        const [viewComponent] = components
        const pageComponent = (viewComponent as any).child()
        expect(pageComponent.style).to.have.property(
          'boxShadow',
          '5px 5px 10px 3px rgba(0, 0, 0, 0.015)',
        )
        expect(pageComponent.style).to.have.property('width')
        expect(pageComponent.style).to.have.property('top')
      })
    })

    describe(magenta(`popUp`), () => {
      it(`should set the visibility to hidden`, async () => {
        expect(
          (await resolveComponent(mock.getPopUpComponent())).style,
        ).to.have.property('visibility', 'hidden')
      })
    })

    describe(magenta(`scrollView`), () => {
      it(`should set the display to "block"`, async () => {
        expect(
          (await resolveComponent(ui.scrollView())).style,
        ).to.have.property('display', 'block')
      })
    })

    describe(magenta(`textView`), () => {
      it(`should set the default "rows" to 10`, async () => {
        expect(
          (await resolveComponent(mock.getTextViewComponent())).style,
        ).to.have.property('rows', 10)
      })
    })

    describe(magenta(`video`), () => {
      it(`should set objectFit to "contain"`, async () => {
        expect((await resolveComponent(ui.video())).style).to.have.property(
          'objectFit',
          'contain',
        )
      })
    })
  })

  describe(magenta(`listObject references`), () => {
    it(`should resolve references coming from listItem data objects`, async () => {
      const listObject = [
        {
          key: 'this is test2',
          height: '0.1',
          bgColor: '0xFFCCCC',
          fontColor: '0xFF0033',
        },
      ]
      const listComponentObject = ui.list({
        listObject,
        iteratorVar: 'itemObject',
        children: [
          ui.listItem({
            iteratorVar: 'itemObject',
            itemObject: '',
            style: {
              width: '1',
              height: 'itemObject.height',
              backgroundColor: 'itemObject.bgColor',
            },
            children: [
              ui.label({
                dataKey: 'itemObject.key',
                style: { width: '1', color: 'itemObject.fontColor' },
              }),
            ],
          }),
        ],
      })
      let list = (
        await NUI.resolveComponents({ components: [listComponentObject] })
      )[0]
      let listItem = list.child()
      let label = listItem.child()
      expect(listItem.style).to.have.property('height', '66.70px')
      expect(listItem.style).to.have.property('backgroundColor', '#FFCCCC')
      expect(label.style).to.have.property('color', '#FF0033')
      listObject[0].height = '0.9'
      listObject[0].bgColor = '0x00000'
      listObject[0].fontColor = '0x334455'
      list = (
        await NUI.resolveComponents({ components: [listComponentObject] })
      )[0]
      listItem = list.child()
      label = listItem.child()
      expect(listItem.style).to.have.property('height', '600.30px')
      expect(listItem.style).to.have.property('backgroundColor', '#00000')
      expect(label.style).to.have.property('color', '#334455')
    })
  })
})
