import * as mock from 'noodl-ui-test-utils'
import { prettyDOM } from '@testing-library/dom'
import { expect } from 'chai'
import { createComponent, Viewport } from 'noodl-ui'
import { coolGold, italic, magenta } from 'noodl-common'
import { createRender } from '../test-utils'
import { dataAttributes } from '../constants'
import findElement from '../utils/findElement'
import * as u from '../utils/internal'
import * as n from '../utils'

describe(coolGold(`utils`), () => {
  describe(italic(`findByDataKey`), () => {
    it(``, async () => {
      const { request } = createRender({
        components: [
          mock.getListItemComponent({
            children: [mock.getLabelComponent({ dataKey: 'abc.fruit' as any })],
          }),
        ],
      })
      const req = await request()
      const components = req?.render()
      const component = components?.[0]
      const node = n.findByDataKey(component)?.[0]
      console.info(prettyDOM(node))
      // expect().to.be.instanceOf(HTMLElement)
    })
  })

  describe(italic(`findElement`), () => {
    it(`should return an array of nodes if there are multiple nodes matched`, async () => {
      const { request } = createRender({
        components: [
          mock.getButtonComponent({ viewTag: 'helloTag' }),
          mock.getTextFieldComponent({ viewTag: 'helloTag' }),
        ],
      })
      const req = await request('Hello')
      req?.render()
      const result = findElement((doc) =>
        doc?.querySelectorAll(`[data-viewtag]`),
      ) as HTMLElement[]
      expect(result).to.be.an('array').with.lengthOf(2)
    })
  })
})

describe(italic(`findByDataAttrib`), () => {
  dataAttributes.forEach((key) => {
    it(`should be able to find a node with the data attribute "${magenta(
      key,
    )}"`, async () => {
      const { request } = createRender({
        components: [
          mock.getButtonComponent({ [key]: key }),
          mock.getTextFieldComponent({ [key]: key }),
        ],
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
})
