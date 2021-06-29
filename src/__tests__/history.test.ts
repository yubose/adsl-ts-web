import * as mock from 'noodl-ui-test-utils'
import { getFirstByElementId } from 'noodl-ui-dom'
import { prettyDOM, waitFor } from '@testing-library/dom'
import { expect } from 'chai'
import { coolGold, italic } from 'noodl-common'
import { createOnPopState } from '../handlers/history'
import { getApp } from '../utils/test-utils'

const getDefaultPageName = () => 'Hello'
const getDefaultPageObject = (other?: Record<string, any>) => ({
  components: [
    mock.getButtonComponent({
      id: 'hi',
      onClick: [mock.getBuiltInAction('goBack')],
    }),
  ],
  ...other,
})
const getRoot = (other?: Record<string, any>) => ({
  [getDefaultPageName()]: getDefaultPageObject(),
  Cereal: { components: [mock.getLabelComponent({ viewTag: 'fruit' })] },
  Chips: {
    components: [
      mock.getImageComponent({ path: 'squirrel.png', viewTag: 'imageTag' }),
    ],
  },
  ...other,
})

describe(coolGold(`history`), () => {
  describe(italic(`createOnPopState`), () => {
    it(``, async () => {
      const app = await getApp({
        navigate: true,
        pageName: getDefaultPageName(),
        pageObject: getDefaultPageObject(),
      } as any)
      const page = app.mainPage
      const node = getFirstByElementId('hi')
      node.click()
      console.info(page)
      page.previous = 'Cereal'
      page.page = ''
      // console.info(app.mainPage.pageUrl)
      // await waitFor(() => {
      //   expect(app.mainPage.pageUrl).not.to.eq('index.html?')
      // })
    })
  })
})
