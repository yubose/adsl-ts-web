import chalk from 'chalk'
import { expect } from 'chai'
import { NOODLUI as NUI, NUIComponent, createComponent, Page } from 'noodl-ui'
import * as u from '../../utils'

xdescribe(chalk.keyword('orange')('isPageConsumer'), () => {
  let pageName = 'What'
  let page: Page

  beforeEach(() => {
    NUI.getRootPage().page = pageName
    NUI.use({
      getRoot: () => ({
        Hello: {},
        [pageName]: {
          components: [
            {
              type: 'view',
              children: [{ type: 'view', children: [{ type: 'popUp' }] }],
            },
          ],
        },
      }),
    })
  })

  it(`should return true if it is a descendant of a "page" component`, () => {
    const popUp = page.child()?.child()?.child() as NUIComponent.Instance
    expect(u.isPageConsumer(popUp)).to.be.true
  })
})

describe(`getDisplayHeight`, () => {
  it(`should use the top, height, marginTop to calculate the display height`, () => {
    const component = createComponent({
      type: 'view',
      style: { top: '0.2', height: '0.4', marginTop: '0.1' },
    })
    expect(u.getDisplayHeight({ component, viewport: noodlui.viewport })).to.eq(
      '466.90px',
    )
    delete component.style.height
    expect(u.getDisplayHeight({ component, viewport: noodlui.viewport })).to.eq(
      '200.10px',
    )
    delete component.style.top
    expect(u.getDisplayHeight({ component, viewport: noodlui.viewport })).to.eq(
      '66.70px',
    )
    delete component.style.marginTop
    expect(u.getDisplayHeight({ component, viewport: noodlui.viewport })).to.eq(
      '0.00px',
    )
  })
})
