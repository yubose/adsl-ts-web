import { expect } from 'chai'
import * as u from '@jsmanifest/utils'
import flatten from '../modules/ExportPdf/flatten'
// data from getElementTreeDimensions(document.querySelector(`[data-viewtag=mainView]`))
import { traverseDFS } from '../utils/dom'
import data from './fixtures/flatten_data.json'
import type { Flattener } from '../modules/ExportPdf'

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

  // Object.defineProperty(el, 'getBoundingClientRect', {
  //   value: () => {
  //     return getBounds(el)
  //   },
  // })

  if (!el.id) el.id = u.getRandomKey()

  return el
}

let flattener: Flattener
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

  let child = createMockElement('div')

  mockElement.appendChild(child)

  mockChildren = traverseDFS((el, _, parent) => {
    el = createMockElement(el)
    parent?.appendChild?.(el)
    return el as HTMLElement
  }, createMockElement(data))

  mockChildren.forEach((props) => mockElement.appendChild(props))
})

afterEach(() => {
  flattener?.clear?.()
})

describe(`flatten`, () => {
  it(`should return the flattener`, () => {
    const el = createMockElement('div', { style: { height: 340 } })
    flattener = flatten({ baseEl: el, pageHeight: 552 })
    expect(flattener).to.have.property('get').to.be.a('function')
  })

  it(`should flatten the child`, () => {
    const el = createMockElement('div', {
      style: { height: 340 },
      scrollHeight: 340,
    })
    const child = createMockElement('label', { scrollHeight: 120 })
    child.id = 'apple'
    el.appendChild(child)
    flattener = flatten({ baseEl: el, pageHeight: 552 })
    expect(flattener.get()).to.have.lengthOf(1)
    expect(flattener.get()[0]).to.have.property('id', 'apple')
  })

  it(`should not directly flatten elements whose height is larger than the pageHeight`, () => {
    const el1 = createMockElement('div', { scrollHeight: 900 })
    const el2 = createMockElement('div', { scrollHeight: 640 })
    const child1 = createMockElement('label', { scrollHeight: 300 })
    const child2 = createMockElement('div', { scrollHeight: 300 })
    const child3 = createMockElement('div', { scrollHeight: 40 })
    child1.id = 'apple'
    child2.id = 'banana'
    child3.id = 'orange'
    el1.appendChild(el2)
    el2.appendChild(child1)
    child1.appendChild(child2)
    child1.appendChild(child3)
    flattener = flatten({ baseEl: el1, pageHeight: 540 })
    expect(flattener.get()).to.have.length.greaterThan(0)
    expect(flattener.has(el1)).to.be.false
    expect(flattener.has(el2)).to.be.false
  })

  describe(`when offsetStart + height exceeds offsetEnd`, () => {
    describe(`when there are children`, () => {
      it(`should not directly flatten el`, () => {
        const el1 = createMockElement('div', { scrollHeight: 900 })
        const el2 = createMockElement('div', { scrollHeight: 640 })
        const child1 = createMockElement('label', { scrollHeight: 300 })
        const child2 = createMockElement('div', { scrollHeight: 300 })
        const child3 = createMockElement('div', { scrollHeight: 40 })
        child1.id = 'apple'
        child2.id = 'banana'
        child3.id = 'orange'
        el1.appendChild(el2)
        el2.appendChild(child1)
        child1.appendChild(child2)
        child1.appendChild(child3)
        flattener = flatten({ baseEl: el1, pageHeight: 540 })
        expect(flattener.get()).to.have.length.greaterThan(0)
        expect(flattener.has(el1)).to.be.false
        expect(flattener.has(el2)).to.be.false
      })

      it(`should flatten the children that exceeds the offsetEnd`, () => {
        const el1 = createMockElement('div', { scrollHeight: 900 })
        const el2 = createMockElement('div', { scrollHeight: 640 })
        const child1 = createMockElement('label', { scrollHeight: 300 })
        const child2 = createMockElement('div', { scrollHeight: 300 })
        const child3 = createMockElement('div', { scrollHeight: 40 })
        child1.id = 'apple'
        child2.id = 'banana'
        child3.id = 'orange'
        el1.appendChild(el2)
        el2.appendChild(child1)
        child1.appendChild(child2)
        child1.appendChild(child3)
        flattener = flatten({ baseEl: el1, pageHeight: 540 })
        expect(flattener.get()).to.have.length.greaterThan(0)
        expect(flattener.has(child1)).to.be.false
        expect(flattener.has(child2)).to.be.true
        expect(flattener.has(child3)).to.be.true
      })

      it(`should flatten the element that exceeds pageHeight from currPageHeight`, () => {
        const el1 = createMockElement('div', { scrollHeight: 900 })
        const el2 = createMockElement('div', { scrollHeight: 640 })
        el1.appendChild(el2)
        flattener = flatten({ baseEl: el1, pageHeight: 540 })
        expect(flattener.has(el2)).to.be.true
      })

      it(`should not flatten the parent element when it exceeds pageHeight and when currPageHeight has not been met`, () => {
        const el1 = createMockElement('div', { scrollHeight: 900 })
        const el2 = createMockElement('div', { scrollHeight: 600 })
        const el3 = createMockElement('div', { scrollHeight: 300 })
        const el4 = createMockElement('div', { scrollHeight: 200 })
        el1.appendChild(el2)
        el2.appendChild(el3)
        el2.appendChild(el4)
        flattener = flatten({ baseEl: el1, pageHeight: 540 })
        expect(flattener.has(el2)).to.be.false
      })
    })

    describe(`when there are no children`, () => {
      it(`should flatten the element`, () => {
        const el1 = createMockElement('div', { scrollHeight: 900 })
        const el2 = createMockElement('div', { scrollHeight: 640 })
        el1.appendChild(el2)
        flattener = flatten({ baseEl: el1, pageHeight: 540 })
        expect(flattener.has(el2)).to.be.true
      })
    })
  })
})
