import { prettyDOM, waitFor } from '@testing-library/dom'
import { expect } from 'chai'
import { coolGold, italic, magenta } from 'noodl-common'
import { createRender, ui } from '../test-utils'
import { dataAttributes } from '../constants'
import NDOM from '../noodl-ui-dom'
import findElement from '../utils/findElement'
import * as u from '../utils/internal'
import * as n from '../utils'

describe(coolGold(`utils`), () => {
  describe(italic(`findByDataKey`), () => {
    xit(``, async () => {
      const { request } = createRender({
        components: [
          ui.listItem({
            children: [ui.label({ dataKey: 'abc.fruit' as any })],
          }),
        ],
      })
      const req = await request()
      const components = req?.render()
      const component = components?.[0]
      const node = n.findByDataKey(component)?.[0]
      // expect().to.be.instanceOf(HTMLElement)
    })
  })

  describe(italic(`findElement`), () => {
    it(`should return an array of nodes if there are multiple nodes matched`, async () => {
      const { request } = createRender({
        components: [
          ui.button({ viewTag: 'helloTag' }),
          ui.textField({ viewTag: 'helloTag' }),
        ],
      })
      const req = await request('Hello')
      await req?.render()
      const result = findElement((doc) =>
        doc?.querySelectorAll(`[data-viewtag]`),
      ) as HTMLElement[]
      await waitFor(() => expect(result).to.be.an('array').with.lengthOf(2))
    })
  })
})

describe(italic(`findByDataAttrib`), () => {
  dataAttributes.forEach((key) => {
    it(`should be able to find a node with the data attribute "${magenta(
      key,
    )}"`, async () => {
      const { request } = createRender({
        components: [ui.button({ [key]: key }), ui.textField({ [key]: key })],
      })
      const req = await request('Hello')
      req?.render()
      const nodes = n.findByDataAttrib(key) as HTMLElement[]
      nodes?.forEach((node) => {
        expect(node).to.be.instanceof(HTMLElement)
        expect(node.dataset).to.have.property(key.replace('data-', ''))
      })
    })
  })

  describe(`isImageDoc`, () => {
    it(`should return true`, () => {
      const ecosObj = ui.ecosDoc('image')
      expect(u.isImageDoc(ecosObj)).to.be.true
    })

    it(`should return false`, () => {
      expect(u.isImageDoc(ui.ecosDoc('pdf'))).to.be.false
      expect(u.isImageDoc(ui.ecosDoc('text'))).to.be.false
      expect(u.isImageDoc(ui.ecosDoc('video'))).to.be.false
    })
  })

  describe(`isPdfDoc`, () => {
    it(`should return true`, () => {
      const ecosObj = ui.ecosDoc('pdf')
      expect(u.isPdfDoc(ecosObj)).to.be.true
    })

    it(`should return false`, () => {
      expect(u.isPdfDoc(ui.ecosDoc('image'))).to.be.false
      expect(u.isPdfDoc(ui.ecosDoc('text'))).to.be.false
      expect(u.isPdfDoc(ui.ecosDoc('video'))).to.be.false
    })
  })

  describe(`isTextDoc`, () => {
    it(`should return true`, () => {
      const ecosObj = ui.ecosDoc('text')
      expect(u.isTextDoc(ecosObj)).to.be.true
    })

    xit(`should return false`, () => {
      expect(u.isTextDoc(ui.ecosDoc('image'))).to.be.false
      expect(u.isTextDoc(ui.ecosDoc('pdf'))).to.be.false
      expect(u.isTextDoc(ui.ecosDoc('video'))).to.be.false
    })
  })

  describe(`isVideoDoc`, () => {
    xit(`should return true`, () => {
      //
    })

    xit(`should return false`, () => {
      //
    })
  })
})
