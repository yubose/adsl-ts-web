import React from 'react'
import * as nt from 'noodl-types'
import * as u from '@jsmanifest/utils'
import { NUI as nui } from 'noodl-ui'
import * as t from '@/types'
import { getStaticPageComponents, render, ui } from './test-utils'

describe.only(`actions`, () => {
  xit(`should execute the actions predictably in order`, () => {
    // const result = render(
    //   { type, [key]: '.Topo.buttonText.message' },
    //   { root: { Topo: { buttonText: { message: 'Cancel' } } } },
    // )
  })

  describe(`carousel`, () => {
    function createEvalObjectProductObject({
      isFlagEqualTo,
      setFlagTo,
      setReferenceToAssignTo,
    }: {
      isFlagEqualTo: string
      setFlagTo: string
      setReferenceToAssignTo: `=..productAitmed${string}`
    }) {
      return ui.evalObject({
        object: [
          ui.ifObject([
            '..tar',
            ui.evalObject({
              object: [
                ui.ifObject([
                  {
                    '=.builtIn.string.equal': {
                      dataIn: { string1: '=..flag', string2: isFlagEqualTo },
                    },
                  },
                  ui.evalObject({
                    object: [
                      { '..flag@': setFlagTo },
                      {
                        '..formDataTemp.messageAitmed@': setReferenceToAssignTo,
                      },
                      { '..tar@': false },
                    ],
                  }),
                  'continue',
                ]),
              ],
            }),
            'continue',
          ]),
        ],
      })
    }

    function createCarouselListDataObject(
      imagePath: string,
      imgName: string,
      isFocused = false,
    ) {
      return {
        imagePath,
        imgName,
        hei: isFocused
          ? 'calc(168.19/1724.81*100vw)'
          : 'calc(100.91/1724.81*100vw)',
        fontSize: isFocused
          ? 'calc(25.24/1724.81*100vw)'
          : 'calc(15.98/1724.81*100vw)',
        color: isFocused ? '0x000000' : '0x333333',
      }
    }

    type CarouselKey =
      | 'cloud'
      | 'customTelePlatform'
      | 'documentation'
      | 'ePrescription'
      | 'hdVideo'
      | 'referral'
      | 'selfScheduling'
      | 'store'

    function getMessageAitmedListObject(
      sm1: CarouselKey,
      sm2: CarouselKey,
      big: CarouselKey,
      sm3: CarouselKey,
      sm4: CarouselKey,
    ) {
      const getImgAndLabel = (
        preset: CarouselKey,
        suffix = 'Small',
      ): [imagePath: string, imgName: string] => {
        switch (preset) {
          case 'customTelePlatform':
            return [`customized${suffix}.png`, 'Customized Telehealth Platform']
          case 'hdVideo':
            return [`video${suffix}.png`, 'HD Video']
          case 'store':
            return [`store${suffix}.png`, 'E-Med Store']
          case 'selfScheduling':
            return [`schduling${suffix}.png`, 'Self-Schduling']
          case 'ePrescription':
            return [`prescription${suffix}.png`, 'E-Prescription']
          case 'referral':
            return [`referral${suffix}.png`, 'E-Referral']
          case 'cloud':
            return [`cloud${suffix}.png`, 'Cloud Waiting Room']
          case 'documentation':
            return [`document${suffix}.png`, 'Documentation']
        }
      }
      return [
        createCarouselListDataObject(...getImgAndLabel(sm1)),
        createCarouselListDataObject(...getImgAndLabel(sm2)),
        createCarouselListDataObject(...getImgAndLabel(big, 'Big')),
        createCarouselListDataObject(...getImgAndLabel(sm3)),
        createCarouselListDataObject(...getImgAndLabel(sm4)),
      ]
    }

    const pageObject = {
      viewPort: 'top',
      flag: '1',
      tar: true,
      formDataTemp: {
        ListData: [
          { key: '1. Self- Scheduling' },
          { key: '2. HD Video Call' },
          { key: '3. Cloud Waiting/Exam Room' },
          { key: '4. E-prescription' },
          { key: '5. Encrypted document Sharing' },
          { key: '6. E-Referral' },
          { key: '7. Customized Telehealth Platform' },
          { key: '8. E-Med Store' },
        ],
        messageAitmed: getMessageAitmedListObject(
          'customTelePlatform',
          'hdVideo',
          'store',
          'selfScheduling',
          'ePrescription',
        ),
        productAitmedZero: getMessageAitmedListObject(
          'customTelePlatform',
          'hdVideo',
          'store',
          'selfScheduling',
          'ePrescription',
        ),
        productAitmedOne: getMessageAitmedListObject(
          'cloud',
          'referral',
          'customTelePlatform',
          'hdVideo',
          'store',
        ),
        productAitmedThree: getMessageAitmedListObject(
          'documentation',
          'cloud',
          'referral',
          'customTelePlatform',
          'hdVideo',
        ),
        productAitmedFour: getMessageAitmedListObject(
          'ePrescription',
          'documentation',
          'cloud',
          'referral',
          'customTelePlatform',
        ),
        productAitmedFive: getMessageAitmedListObject(
          'selfScheduling',
          'ePrescription',
          'documentation',
          'cloud',
          'referral',
        ),
        productAitmedSix: getMessageAitmedListObject(
          'store',
          'selfScheduling',
          'ePrescription',
          'documentation',
          'cloud',
        ),
        productAitmedSeven: getMessageAitmedListObject(
          'hdVideo',
          'store',
          'selfScheduling',
          'ePrescription',
          'documentation',
        ),
      },
      components: [
        ui.view({
          children: [
            ui.image({
              path: 'IconIonicArrowBackL.png',
              onClick: [
                createEvalObjectProductObject({
                  isFlagEqualTo: '1',
                  setFlagTo: '2',
                  setReferenceToAssignTo: '=..productAitmedOne',
                }),
                createEvalObjectProductObject({
                  isFlagEqualTo: '2',
                  setFlagTo: '3',
                  setReferenceToAssignTo: '=..productAitmedTwo',
                }),
                createEvalObjectProductObject({
                  isFlagEqualTo: '3',
                  setFlagTo: '4',
                  setReferenceToAssignTo: '=..productAitmedThree',
                }),
                createEvalObjectProductObject({
                  isFlagEqualTo: '4',
                  setFlagTo: '5',
                  setReferenceToAssignTo: '=..productAitmedFour',
                }),
                createEvalObjectProductObject({
                  isFlagEqualTo: '5',
                  setFlagTo: '6',
                  setReferenceToAssignTo: '=..productAitmedFive',
                }),
                createEvalObjectProductObject({
                  isFlagEqualTo: '6',
                  setFlagTo: '7',
                  setReferenceToAssignTo: '=..productAitmedSix',
                }),
                createEvalObjectProductObject({
                  isFlagEqualTo: '7',
                  setFlagTo: '8',
                  setReferenceToAssignTo: '=..productAitmedSeven',
                }),
                createEvalObjectProductObject({
                  isFlagEqualTo: '8',
                  setFlagTo: '1',
                  setReferenceToAssignTo: '=..productAitmedZero',
                }),
                ui.evalObject({ object: [{ '..tar@': false }] }),
                ui.builtIn({ funcName: 'redraw', viewTag: 'aitmedList' }),
                ui.builtIn({ funcName: 'redraw', viewTag: 'imgViewTag' }),
              ],
            }),
            ui.view({
              children: [
                ui.list({
                  id: 'abc123',
                  contentType: 'listObject',
                  iteratorVar: 'itemObject',
                  listObject: '..formDataTemp.messageAitmed',
                  viewTag: 'aitmedList',
                  children: [
                    ui.listItem({
                      itemObject: '',
                      children: [
                        ui.image({
                          path: `itemObject.imagePath`,
                          style: { height: `itemObject.hei` },
                        }),
                        ui.label({
                          dataKey: 'itemObject.imgName',
                          style: {
                            fontSize: 'itemObject.fontSize',
                            fontWeight: 'itemObject.fontWeight',
                            color: 'itemObject.color',
                          },
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            ui.image({
              path: 'IconIonicArrowBack.png',
              onClick: [
                createEvalObjectProductObject({
                  isFlagEqualTo: '1',
                  setFlagTo: '8',
                  setReferenceToAssignTo: '=..productAitmedSeven',
                }),
                createEvalObjectProductObject({
                  isFlagEqualTo: '8',
                  setFlagTo: '7',
                  setReferenceToAssignTo: '=..productAitmedSix',
                }),
                createEvalObjectProductObject({
                  isFlagEqualTo: '7',
                  setFlagTo: '6',
                  setReferenceToAssignTo: '=..productAitmedFive',
                }),
                createEvalObjectProductObject({
                  isFlagEqualTo: '6',
                  setFlagTo: '5',
                  setReferenceToAssignTo: '=..productAitmedFour',
                }),
                createEvalObjectProductObject({
                  isFlagEqualTo: '5',
                  setFlagTo: '4',
                  setReferenceToAssignTo: '=..productAitmedThree',
                }),
                createEvalObjectProductObject({
                  isFlagEqualTo: '4',
                  setFlagTo: '3',
                  setReferenceToAssignTo: '=..productAitmedTwo',
                }),
                createEvalObjectProductObject({
                  isFlagEqualTo: '3',
                  setFlagTo: '2',
                  setReferenceToAssignTo: '=..productAitmedOne',
                }),
                createEvalObjectProductObject({
                  isFlagEqualTo: '2',
                  setFlagTo: '1',
                  setReferenceToAssignTo: '=..productAitmedZero',
                }),
                ui.evalObject({ object: [{ '..tar@': true }] }),
                ui.builtIn({ funcName: 'redraw', viewTag: 'aitmedList' }),
              ],
            }),
          ],
        }),
      ],
    }

    beforeEach(() => {
      nui.use({
        getAssetsUrl: () => `https://public.aitmed.com/cadl/www4.06/assets/`,
        getBaseUrl: () => `https://public.aitmed.com/cadl/www4.06/`,
        getPages: () => ['AiTmedContact'],
      })
      const page = nui.getRootPage()
      page.page = 'AiTmedContact'
      page.viewport.width = 1024
      page.viewport.height = 768
    })

    afterEach(() => {
      nui.reset()
    })

    it(``, async () => {
      const { components, lists } = await getStaticPageComponents(
        pageObject.components,
      )

      const { assetsUrl, baseUrl, getByText } = render(components, {
        pageContext: { lists },
        root: { AiTmedContact: pageObject },
      })

      const arrowRightBtn = document.querySelector(
        `img[src="${assetsUrl}IconIonicArrowBack.png"]`,
      ) as HTMLImageElement

      console.dir(components, { depth: Infinity })
      // arrowRightBtn.click()
    })
  })
})
