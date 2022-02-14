import * as u from '@jsmanifest/utils'
import fs from 'fs-extra'
import path from 'path'
import flatten from '../modules/ExportPdf/flatten'
// data from getElementTreeDimensions(document.querySelector(`[data-viewtag=mainView]`))
import { traverseDFS } from '../utils/dom'
import data from './fixtures/flatten_data.json'

function createMockElement(
  tagName = 'div' as string | Record<string, any>,
  props: any = {},
) {
  if (u.isObj(tagName)) {
    props = tagName
    tagName = props.tagName
  }

  const el = document.createElement(tagName as string)

  for (const [key, value] of u.entries(props)) {
    if (key === 'style') {
      Object.defineProperty(el.style, key, {
        configurable: true,
        enumerable: true,
        value: value,
      })
    } else {
      Object.defineProperty(el, key, {
        configurable: true,
        enumerable: true,
        value: value,
      })
    }
  }

  return el
}

let mockChildren: HTMLElement[]
let mockElement: HTMLElement

beforeEach(() => {
  mockElement = createMockElement({
    id: 'safsa',
    nextSibling: null,
    scrollHeight: 553,
    tagName: 'div',
    x: 378.9375,
    y: 126.96875,
    width: 784.5,
    height: 552.765625,
    top: 126.96875,
    right: 1163.4375,
    bottom: 679.734375,
    left: 378.9375,
  })

  mockChildren = traverseDFS((el, _, parent) => {
    el = createMockElement(el)
    parent?.appendChild?.(el)
    return el as HTMLElement
  }, mockElement)

  mockChildren.forEach((props) => mockElement.appendChild(props))
})

describe(`flatten`, () => {
  it(``, () => {
    const flattener = flatten({ baseEl: mockElement, pageHeight: 552 })
    // fs.writeJsonSync('./exportPdfData.json', flattener.get(), {
    //   spaces: 2,
    // })
    console.log(mockElement)
  })

  describe(`when total height is larger than offsetHeight`, () => {
    describe(`when there are children`, () => {
      xit(`should not flatten element`, () => {
        //
      })

      it(`should recurse flatten passing in firstChild`, () => {
        //
      })
    })

    describe(`when there are no children`, () => {
      xit(`should flatten`, () => {
        //
      })

      xit(`should add totalHeight to accHeight`, () => {
        //
      })

      it(`should continue with next sibling`, () => {
        //
      })
    })

    describe(`should still be recursing on siblings`, () => {
      xit(``, () => {
        //
      })
    })
  })
})
