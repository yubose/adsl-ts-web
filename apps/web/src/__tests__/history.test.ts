import m from 'noodl-test-utils'
import { findFirstByElementId } from 'noodl-ui'
import { getApp } from '../utils/test-utils'

const getDefaultPageName = () => 'Hello'
const getDefaultPageObject = (other?: Record<string, any>) => ({
  components: [
    m.button({
      id: 'hi',
      onClick: [m.builtIn('goBack')],
    }),
  ],
  ...other,
})
const getRoot = (other?: Record<string, any>) => ({
  [getDefaultPageName()]: getDefaultPageObject(),
  Cereal: { components: [m.label({ viewTag: 'fruit' })] },
  Chips: {
    components: [m.image({ path: 'squirrel.png', viewTag: 'imageTag' })],
  },
  ...other,
})

describe(`history`, () => {
  describe(`createOnPopState`, () => {
    it(``, async () => {
      const app = await getApp({
        navigate: true,
        pageName: getDefaultPageName(),
        pageObject: getDefaultPageObject(),
      } as any)
      const page = app.mainPage
      const node = findFirstByElementId('hi')
      node.click()
      page.previous = 'Cereal'
      page.page = ''
      // console.info(app.mainPage.pageUrl)
      // await waitFor(() => {
      //   expect(app.mainPage.pageUrl).not.to.eq('index.html?')
      // })
    })
  })
})
