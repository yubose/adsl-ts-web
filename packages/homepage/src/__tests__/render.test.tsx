import React from 'react'
import * as nt from 'noodl-types'
import * as u from '@jsmanifest/utils'
import {
  act,
  fireEvent,
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
import { renderComponent, ui } from './test-utils'

describe('render', () => {
  it('should render to the DOM', () => {
    const { getByText } = renderComponent({ type: 'label', text: 'hello' })
    expect(getByText('hello')).toBeInTheDocument()
  })

  it(`should be able to render referenced components`, () => {
    const component = { '.BaseHeader': null }
    const { getByText } = renderComponent(component, {
      root: {
        HomePage: { components: [component] },
        BaseHeader: { type: 'button', text: 'Submit' },
      },
    })
    expect(getByText('Submit')).toBeInTheDocument()
  })

  it.skip(`should render values that are referenced`, () => {
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

  describe(`carousel onClick`, () => {
    const getOnClick = () =>
      // @ts-expect-error
      [
        { string2: '1', flag: '8', message: 'Seven' },
        { string2: '8', flag: '7', message: 'Six' },
        { string2: '7', flag: '6', message: 'Five' },
        { string2: '6', flag: '5', message: 'Four' },
        { string2: '5', flag: '4', message: 'Three' },
        { string2: '4', flag: '3', message: 'Two' },
        { string2: '3', flag: '2', message: 'One' },
        { string2: '2', flag: '1', message: 'Zero' },
      ]
        .map(({ string2, flag, message }) =>
          ui.evalObject([
            ui.ifObject([
              '..tar',
              ui.evalObject([
                ui.ifObject([
                  {
                    '=.builtIn.string.equal': {
                      dataIn: { string1: '=..flag', string2 },
                    },
                  },
                  ui.evalObject([
                    { '..flag@': flag },
                    {
                      '.Resource.messageAitmed@': `=..productAitmed${message}`,
                    },
                    { '..tar@': false },
                  ]),
                  'continue',
                ]),
              ]),
              'continue',
            ]),
          ]),
        )
        .concat(
          ui.evalObject([{ '..tar@': true }]),
          ui.builtIn({ funcName: 'redraw', viewTag: 'aitmedList' }),
        )

    const createPrimaryMessageAitmedBox = (imagePath, imgName) => ({
      imagePath,
      imgName,
      hei: 'calc(168.19/1724.81*100vw)',
      fontSize: 'calc(25.24/1724.81*100vw)',
      color: '0x000000',
      fontWeight: '600',
    })

    const createSecondaryMessageAitmedBox = (imagePath, imgName) => ({
      imagePath,
      imgName,
      hei: 'calc(100.91/1724.81*100vw)',
      fontSize: 'calc(15.98/1724.81*100vw)',
      color: '0x333333',
    })

    const getRootObject = ({
      withProps,
    }: {
      withProps?: {
        Topo?: Record<string, any>
        Resource?: Record<string, any>
      }
    } = {}) => {
      const Resource = {
        productFlag: '0',
        wellnessFlag: '0',
        signInFlag: '0',
        messageAitmed: [
          createSecondaryMessageAitmedBox(
            'customizedSmall.png',
            'Customized Telehealth Platform',
          ),
          createSecondaryMessageAitmedBox('videoSmall.png', 'HD Video'),
          createPrimaryMessageAitmedBox('storeBig.png', 'E-Med Store'),
          createSecondaryMessageAitmedBox(
            'schdulingSmall.png',
            'Self-Schduling',
          ),
          createSecondaryMessageAitmedBox(
            'presciptionSmall.png',
            'E-Prescription',
          ),
        ],
        ...withProps?.Resource,
      }

      return {
        Topo: {
          buttonText: { message: 'Change cancel message' },
          flag: '1',
          tar: true,
          ...withProps?.Topo,
          components: [
            ui.view({
              children: [
                ui.list({
                  contentType: 'listObject',
                  listObject: Resource.messageAitmed,
                  iteratorVar: 'itemObject',
                  viewTag: 'aitmedList',
                  style: {
                    height: 'calc(336.4/1724.81*100vw)',
                    width: 'calc(1122.74/1724.81*100vw)',
                    left: 'calc(37.43/1724.81*100vw)',
                  },
                  children: Resource.messageAitmed.map((obj) =>
                    ui.listItem({
                      itemObject: obj,
                      style: {
                        height: 'calc(336.4/1724.81*100vw)',
                        width: 'calc(224.55/1724.81*100vw)',
                      },
                      children: [
                        ui.image({
                          path: obj.imagePath,
                          style: { height: obj.hei },
                        }),
                        {
                          type: 'label',
                          dataKey: obj.imgName,
                          text: obj.imgName,
                          style: {
                            top: 'calc(294.35/1724.81*100vw)',
                            width: 'calc(239.52/1724.81*100vw)',
                            fontSize: obj.fontSize,
                            color: obj.color,
                            height: 'calc(67.28/1724.81*100vw)',
                          },
                        },
                      ],
                    }),
                  ),
                }),
              ],
            }),
            // @ts-expect-error
            ...(withProps?.Topo?.components ? withProps.Topo.components : []),
          ],
        },
        BaseHeader: { type: 'button', text: '.Topo.buttonText.message' },
        Resource,
      }
    }

    it.only(`should update the value of Topo.tar`, async () => {
      const btnComponent = ui.button({
        onClick: getOnClick(),
        text: 'Send',
        viewTag: 'sendView',
      })
      const root = getRootObject({
        withProps: {
          Topo: {
            components: [
              btnComponent,
              { type: 'label', dataKey: 'Resource.tar', text: '.Resource.tar' },
            ],
          },
        },
      })
      const { getByText } = renderComponent(root.Topo.components, {
        pageName: 'Topo',
        root,
      })
      const button = getByText('Send')
      fireEvent.click(button)
      screen.debug()

      await waitFor(() => {
        expect(getByText('true')).toBeInTheDocument()
      })
    })
  })
})
