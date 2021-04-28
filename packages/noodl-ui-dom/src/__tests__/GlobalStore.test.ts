import * as mock from 'noodl-ui-test-utils'
import { expect } from 'chai'
import { coolGold, italic } from 'noodl-common'
import {
  findByGlobalId,
  getFirstByElementId,
  getFirstByGlobalId,
} from '../utils'
import { ndom, createRender } from '../test-utils'
import { GlobalComponentRecord, GlobalStore } from '../global'

describe(coolGold(`GlobalStore`), () => {
  it.only(
    italic(
      `should return true if the component is referenced in the global store`,
    ),
    async () => {
      const popUpView = 'helloView'
      const { ndom, page, render } = createRender({
        components: mock.getPopUpComponent({ popUpView, global: true }),
      })
      expect(ndom.global.)
      const component = await render()
      expect
      console.info(component)
      console.info(ndom.global.components)
    },
  )

  xit(
    italic(
      `should return true if the DOM node is referenced in the global store`,
    ),
    async () => {
      //
    },
  )
})
