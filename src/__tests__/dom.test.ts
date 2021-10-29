import * as u from '@jsmanifest/utils'
import sinon from 'sinon'
import { prettyDOM } from '@testing-library/dom'
import { expect } from 'chai'
import { screen, waitFor } from '@testing-library/dom'
import { findFirstByElementId } from 'noodl-ui-dom'
import { getPageElements } from '../utils/exportToPDF'

describe(u.yellow('DOM'), () => {
  // xit(`should display the resolved data-value for a dataValue emit`, async () => {
  //   const email = 'abc@gmail.com'
  //   const value = 'myval123'
  //   const { ndom, render } = createRender({
  //     pageObject: {
  //       formData: { email },
  //       components: [
  //         mock.getTextFieldComponent({
  //           id: 't',
  //           dataValue: [
  //             mock.getEmitObject({
  //               dataKey: { var1: `formData.email` },
  //               actions: [],
  //             }),
  //           ],
  //         }),
  //       ],
  //     },
  //   })
  //   const spy = sinon.spy(async () => value)
  //   ndom.use({
  //     action: {
  //       emit: [
  //         {
  //           fn: spy,
  //           trigger: 'dataValue',
  //         },
  //       ],
  //     },
  //   })
  //   await render()
  //   const node = findFirstByElementId('t') as HTMLInputElement
  //   await waitFor(() => {
  //     expect(node.dataset.value).to.eq(value)
  //     expect(node.value).to.eq(value)
  //   })
  // })

  describe(u.italic(`exportToPDF`), () => {
    const pageWidth = 467
    const pageHeight = 937

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

    const getPageElementResults = () => [
      {
        id: '_eureh62yw',
        bounds: {
          x: 0,
          y: 93.6875,
          width: 467,
          height: 431.515625,
          top: 93.6875,
          right: 467,
          bottom: 525.203125,
          left: 0,
        },
        text: 'General InformationFirst nameMiddle',
        index: 0,
      },
      {
        id: '_v4v6mlfqs',
        bounds: {
          x: 0,
          y: 543.9375,
          width: 467,
          height: 46.828125,
          top: 543.9375,
          right: 467,
          bottom: 590.765625,
          left: 0,
        },
        text: 'Past Medical History',
        index: 1,
      },
      {
        id: '_hicbyubkl',
        bounds: {
          x: 0,
          y: 600.125,
          width: 467,
          height: 84.296875,
          top: 600.125,
          right: 467,
          bottom: 684.421875,
          left: 0,
        },
        text: 'AllergiesAllergy/IrritantWhat happe',
        index: 2,
      },
      {
        id: '_hs61f2kpz',
        bounds: {
          x: 0,
          y: 703.15625,
          width: 467,
          height: 84.296875,
          top: 703.15625,
          right: 467,
          bottom: 787.453125,
          left: 0,
        },
        text: 'Current MedicationsNameStrengthAmou',
        index: 3,
      },
      {
        id: '_sxu069zaw',
        bounds: {
          x: 0,
          y: 806.1875,
          width: 467,
          height: 84.296875,
          top: 806.1875,
          right: 467,
          bottom: 890.484375,
          left: 0,
        },
        text: 'ImmunizationsName1st Dose2st DoseRe',
        index: 4,
      },
      {
        id: '_wjb2wdguc',
        bounds: {
          x: 0,
          y: 909.21875,
          width: 467,
          height: 84.296875,
          top: 909.21875,
          right: 467,
          bottom: 993.515625,
          left: 0,
        },
        text: 'HospitalizationsDateReason',
        index: 5,
      },
      {
        id: '_i8737d2ab',
        bounds: {
          x: 0,
          y: 1012.25,
          width: 467,
          height: 84.296875,
          top: 1012.25,
          right: 467,
          bottom: 1096.546875,
          left: 0,
        },
        text: 'Surgical HistoryDateReason',
        index: 6,
      },
    ]

    const getMockElements = () => {
      const elements = [] as MockElement[]
      let index = 0
      for (const props of getPageElementResults()) {
        const mockElem = new MockElement({
          bounds: props.bounds,
          id: props.id,
          textContent: props.text,
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

    it(`should return start: 0, end: 431.515625 for child #1`, () => {
      const nodes = getMockElements()
      const results = getPageElements(nodes[0], pageHeight)
      const start = 0
      const height = nodes[0].getBoundingClientRect().height
      expect(results[0]).to.have.property('start', start)
      expect(results[0]).to.have.property('end', start + height)
    })

    it(`should return start: 431.515625, end: 543.9375 for child #2`, () => {
      const start = 431.515625
      const nodes = getMockElements()
      const results = getPageElements(nodes[0], pageHeight)
      const height = nodes[1].getBoundingClientRect().height
      expect(results[1]).to.have.property('start', start)
      expect(results[1]).to.have.property('end', start + height)
    })

    it(`should return start: 600.125, end: 684.421875 for child #3`, () => {
      const start = 478.34375
      const nodes = getMockElements()
      const results = getPageElements(nodes[0], pageHeight)
      const height = nodes[2].getBoundingClientRect().height
      expect(results[2]).to.have.property('start', start)
      expect(results[2]).to.have.property('end', start + height)
    })

    it(`should return start: 703.15625, end: 787.453125 for child #4`, () => {
      const start = 562.640625
      const nodes = getMockElements()
      const results = getPageElements(nodes[0], pageHeight)
      const height = nodes[3].getBoundingClientRect().height
      expect(results[3]).to.have.property('start', start)
      expect(results[3]).to.have.property('end', start + height)
    })
  })

  // xdescribe(u.italic(`textField (password)`), () => {
  //   const dataKey = 'formData.greeting'
  //   let eyeOpened = 'makePasswordVisiable.png'
  //   let eyeClosed = 'makePasswordInvisible.png'
  //   let regexTitlePwInvisible = /click here to reveal your password/i

  //   const getPasswordTextField = () => ({
  //     type: 'textField',
  //     id: 'password',
  //     contentType: 'password',
  //     dataKey,
  //     placeholder: 'your password',
  //   })

  //   it('should start off with hidden password mode for password inputs', async () => {
  //     const { render } = createRender({
  //       components: [
  //         mock.getViewComponent({ children: [getPasswordTextField()] }),
  //       ],
  //     })
  //     const component = await render()
  //     const node = findFirstByElementId('password') as HTMLInputElement
  //     expect(node).to.exist
  //     await waitFor(() => {
  //       expect(node.type).to.equal('password')
  //     })
  //   })

  //   it('should start off showing the eye closed icon', async () => {
  //     page.render(noodlComponent)
  //     await waitFor(() => {
  //       const img = document.getElementsByTagName('img')[0]
  //       expect(img.getAttribute('src')).to.eq(assetsUrl + eyeClosed)
  //     })
  //   })

  //   it('should flip the eye icon to open when clicked', async () => {
  //     page.render(noodlComponent)
  //     const eyeContainer = await screen.findByTitle(regexTitlePwInvisible)
  //     let img = document.querySelector('img')
  //     expect(img).to.exist
  //     expect(img?.getAttribute('src')).not.to.eq(assetsUrl + eyeOpened)
  //     await waitFor(() => {
  //       img = document.querySelector('img')
  //       expect(img?.getAttribute('src')).to.eq(assetsUrl + eyeClosed)
  //     })
  //     expect(eyeContainer).to.exist
  //     eyeContainer.click()
  //     img?.click()
  //   })
  // })
})
