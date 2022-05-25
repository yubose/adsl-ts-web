import React from 'react'
import { fireEvent, prettyDOM, waitFor, screen } from '@testing-library/react'
import { render, ui } from './test-utils'

describe.skip('render', () => {
  it('should render to the DOM', () => {
    const { getByText } = render({ type: 'label', text: 'hello' })
    expect(getByText('hello')).toBeInTheDocument()
  })

  describe(`references`, () => {
    it(`should be able to render string type referenced components`, () => {
      const root = { BaseHeader: { type: 'button', text: 'Submit' } }
      expect(
        render('.BaseHeader', { root }).getByText(/Submit/i),
      ).toBeInTheDocument()
    })

    it(`should be able to render object type referenced components`, () => {
      const { getByText } = render(
        { '.BaseHeader': null },
        { root: { BaseHeader: { type: 'button', text: 'Submit' } } },
      )
      expect(getByText(/Submit/i)).toBeInTheDocument()
    })

    for (const { fkey, type, key, attr = key } of [
      { type: 'textField', key: 'placeholder', fkey: 'getByPlaceholderText' },
      // { type: 'textField', key: 'dataKey', fkey: 'getByDisplayValue', attr: 'value', },
      { type: 'label', key: 'text', fkey: 'getByText' },
      // { type: 'label', key: 'dataKey', fkey: 'getByText' },
      { type: 'view', key: 'text', fkey: 'getByText' },
    ] as {
      key: string
      attr?: string
      type: string
      fkey: keyof ReturnType<typeof render>
    }[]) {
      it(`should parse referenced ${key}(s)`, () => {
        const result = render(
          { type, [key]: '.Topo.buttonText.message' },
          { root: { Topo: { buttonText: { message: 'Cancel' } } } },
        )
        // @ts-expect-error
        expect(result[fkey]('Cancel')).toBeInTheDocument()
      })
    }
  })
})

xdescribe(`state management`, () => {
  it(
    `should update the children to show the new value if an action inside ` +
      `an onClick mutated the root object`,
    async () => {
      const components = [
        {
          type: 'label',
          text: 'coffee',
          onClick: [
            {
              actionType: 'evalObject',
              object: [
                {
                  [`=.builtIn.object.setProperty`]: {
                    dataIn: {
                      arr: [1, 2, 3],
                      obj: '=.Topo.buttonText',
                      label: 'title',
                      text: 'Home',
                      varArr: ['2.28vh', '600', '0x388fcd'],
                      errorArr: ['2.28vh', '400', '0x000000'],
                      // '=.Topo.components.0.text@': 'Canceled!',
                    },
                    dataOut: 'Topo.mutatedData',
                  },
                },
              ],
            },
          ],
        },
        { '.BaseHeader': null },
      ]
      const { getByText } = render(components, {
        pageName: 'Topo',
        root: {
          Topo: { buttonText: { message: 'Change cancel message' } },
          BaseHeader: { type: 'button', text: '.Topo.buttonText.message' },
        },
      })
      const label = getByText('coffee')
      expect(label).toBeInTheDocument()
      label.click()
      await waitFor(() => {
        expect(getByText('Change cancel message')).toBeInTheDocument()
      })
      console.log(prettyDOM())
    },
  )
})
