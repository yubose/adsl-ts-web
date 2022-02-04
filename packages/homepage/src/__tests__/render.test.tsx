import React from 'react'
import * as nt from 'noodl-types'
import * as u from '@jsmanifest/utils'
import {
  prettyDOM,
  render,
  RenderResult,
  waitFor,
  screen,
} from '@testing-library/react'
import useActionChain from '@/hooks/useActionChain'
import useCtx from '@/useCtx'
import useGetNoodlPages from '@/hooks/useGetNoodlPages'
import usePageCtx from '@/usePageCtx'
import useRenderer from '@/hooks/useRenderer'
import useRootObject from '@/hooks/useRootObject'
import * as t from '@/types'
import { renderComponent } from './test-utils'

describe('render', () => {
  it('should render to the DOM', () => {
    const { getByText } = renderComponent({ type: 'label', text: 'hello' })
    expect(getByText('hello')).toBeInTheDocument()
  })

  it.only(`should be able to render referenced components`, () => {
    const component = { '.BaseHeader': null }
    const { getByText } = renderComponent(component, {
      root: {
        HomePage: { components: [component] },
        BaseHeader: { type: 'button', text: 'Submit' },
      },
    })
    expect(getByText('Submit')).toBeInTheDocument()
  })

  it(`should render values that are referenced`, () => {
    const component = {
      type: 'textField',
      placeholder: '.Topo.buttonText.message',
    }
    const { getByPlaceholderText } = renderComponent(component, {
      root: {
        Topo: { buttonText: { message: 'Cancel' } },
        HomePage: { components: [component] },
        BaseHeader: { type: 'button', text: 'Abc' },
      },
    })
    expect(getByPlaceholderText('Cancel')).toBeInTheDocument()
  })
})

describe(`state management`, () => {
  xit(
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
      const { getByText } = renderComponent(components, {
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
