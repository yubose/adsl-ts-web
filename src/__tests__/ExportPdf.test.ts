import { expect } from 'chai'
import { prettyDOM } from '@testing-library/dom'
import * as u from '@jsmanifest/utils'
import * as nc from 'noodl-common'
import * as nt from 'noodl-types'
import * as nu from 'noodl-utils'
import ExportPdf, { Item } from '../modules/ExportPdf'
import createCanvas from '../modules/ExportPdf/createCanvas'
import createPages from '../modules/ExportPdf/createPages_next'
import getPageElements from '../modules/ExportPdf/getPageElements'
import {
  itemsWhereSomeChildrenWillOverflow,
  pageElementResults,
} from './fixtures/ExportPdf.json'

class MockElement {
  #bounds: DOMRect
  #id = ''
  #next: HTMLElement
  #textContent = '';

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return {
      bounds: this.#bounds,
      id: this.id,
      nextElementSibling: this.nextElementSibling,
      textContent: this.textContent,
    }
  }

  constructor({
    bounds,
    id,
    props,
    textContent,
  }: {
    bounds: any
    id: any
    textContent: any
  }) {
    this.#id = id
    this.#bounds = bounds as any
    this.#next = props
    this.#textContent = textContent
  }

  get style() {
    return {}
  }

  set style(style) {}

  get tagName() {
    return ''
  }

  get id() {
    return this.#id
  }

  set next(el: HTMLElement) {
    this.#next = el
  }

  get nextElementSibling() {
    return this.#next || null
  }

  getBoundingClientRect() {
    return this.#bounds
  }

  get textContent() {
    return this.#textContent
  }
}

const getItems = <V>(items: V[]): V[] => items.map((r) => ({ ...r }))

const pageWidth = 467
const pageHeight = 937

const getMockElements = <V = any>(results: V[]) => {
  const elements = [] as MockElement[]
  let index = 0
  for (const props of results) {
    const mockElem = new MockElement({
      bounds: props['bounds'],
      id: props['id'],
      textContent: props['text'],
      children: props.children,
    })
    if (index) {
      // @ts-expect-error
      elements[index - 1].next = mockElem as HTMLElement
    }
    index++
    elements.push(mockElem)
  }
  return elements
}

describe(u.yellow(`ExportPdf`), () => {
  describe(u.italic(`getPageElements`), () => {
    it(`should return start: 0, end: 431.515625 for child #1`, () => {
      const nodes = getMockElements(pageElementResults)
      const { items } = getPageElements(nodes[0], pageHeight)
      const start = 0
      const height = nodes[0].getBoundingClientRect().height
      expect(items[0]).to.have.property('start', start)
      expect(items[0]).to.have.property('end', start + height)
    })

    it(`should return start: 431.515625, end: 543.9375 for child #2`, () => {
      const start = 431.515625
      const nodes = getMockElements(pageElementResults)
      const { items } = getPageElements(nodes[0], pageHeight)
      const height = nodes[1].getBoundingClientRect().height
      expect(items[1]).to.have.property('start', start)
      expect(items[1]).to.have.property('end', start + height)
    })

    it(`should return start: 600.125, end: 684.421875 for child #3`, () => {
      const start = 478.34375
      const nodes = getMockElements(pageElementResults)
      const { items } = getPageElements(nodes[0], pageHeight)
      const height = nodes[2].getBoundingClientRect().height
      expect(items[2]).to.have.property('start', start)
      expect(items[2]).to.have.property('end', start + height)
    })

    it(`should return start: 703.15625, end: 787.453125 for child #4`, () => {
      const start = 562.640625
      const nodes = getMockElements(pageElementResults)
      const { items } = getPageElements(nodes[0], pageHeight)
      const height = nodes[3].getBoundingClientRect().height
      expect(items[3]).to.have.property('start', start)
      expect(items[3]).to.have.property('end', start + height)
    })

    describe(`when the element will overflow to the next page`, () => {
      describe(`when it is some of the children that will overflow and not all of them`, () => {
        let items = getItems(itemsWhereSomeChildrenWillOverflow.items)
        let pageHeight = itemsWhereSomeChildrenWillOverflow.pageHeight
        let nodes: MockElement[]

        beforeEach(() => {
          items = getItems(itemsWhereSomeChildrenWillOverflow.items)
          for (const item of items) {
            if (item.children?.length) {
              let index = 0
              for (const ch of item.children) {
                // @ts-expect-error
                item.children[index].getBoundingClientRect = () => ch.height
                item.children[index].textContent = ch.textContent
                index++
              }
            }
          }
          nodes = getMockElements(items)
        })

        it(`should add the overflowing children ids to item.hide`, () => {
          const { first, last, items, totalHeight } = getPageElements(
            nodes[0],
            pageHeight,
          )
          console.info({
            first,
            last,
            items,
            totalHeight,
            hide: items[0].hide,
          })
          const hideIds = last?.hide.children as string[]
          // console.info({ hide: last.hide, items })
          expect(hideIds.length).to.be.greaterThan(0)
          expect(hideIds.length).to.eq(5)
          for (const item of items) {
            expect(hideIds).to.include.members([item.id])
          }
        })
      })

      describe(`when the whole element itself will overflow `, () => {
        xit(``, () => {
          //
        })
      })
    })
  })

  describe(u.italic(`createPages`), () => {
    it(``, () => {
      //
    })
  })

  describe.only(u.italic(`getSnapObjects`), () => {
    describe(`when the element will overflow`, () => {
      it(`should traverse the children to get their start/end positions`, async () => {
        const pageHeight = 880
        const createLi = () => document.createElement('li')
        const view = document.createElement('div')
        view.style.height = '600px'
        const list = document.createElement('ul')
        list.style.height = '350px'
        const label = document.createElement('div')
        label.style.height = '70px'
        view.appendChild(list)
        const [li1, li2, li3] = [createLi(), createLi(), createLi()]
        list.appendChild(li1)
        list.appendChild(li2)
        list.appendChild(li3)
        li2.appendChild(label)
        document.body.style.height = '1000px'
        document.body.appendChild(view)

        // const pages = await createPages(
        //   {
        //     addPage: () => {},
        //     addImage: () => {},
        //   } as any,
        //   view,
        //   { pageWidth: 366, pageHeight },
        // )

        // console.info({ pages })
        console.info(prettyDOM(view.firstElementChild))
      })

      describe(`when one or more children is overflowing`, () => {
        xit(`should `, () => {
          //
        })
      })

      describe(`when the element itself with no children is overflowing`, () => {
        xit(``, () => {
          //
        })
      })

      it(`should visit the siblings if the element and its children is not overflowing yet`, () => {
        //
      })

      describe(`when a sibling is overflowing`, () => {
        xit(``, () => {
          //
        })
      })
    })

    describe(`when the element will not overflow`, () => {
      xit(`should not visit children`, () => {
        //
      })

      xit(`should visit the next sibling`, () => {
        //
      })
    })
  })
})
