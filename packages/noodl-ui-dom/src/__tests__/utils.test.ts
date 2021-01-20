import chalk from 'chalk'
import { expect } from 'chai'
import { ComponentInstance, Page } from 'noodl-ui'
import { noodlui } from '../test-utils'
import { waitFor } from '@testing-library/dom'
import * as u from '../utils'

describe(chalk.keyword('orange')('isPageConsumer'), () => {
  let pageName = 'What'
  let page: Page

  beforeEach(() => {
    noodlui.setPage('Hello')
    noodlui.use({
      getRoot: () => ({
        Hello: {},
        What: {
          components: [
            {
              type: 'view',
              children: [{ type: 'view', children: [{ type: 'popUp' }] }],
            },
          ],
        },
      }),
    })
    page = noodlui.resolveComponents({
      type: 'page',
      style: {},
      path: pageName,
    }) as Page
  })

  it(`should return true if it is a descendant of a "page" component`, () => {
    const popUp = page.child()?.child()?.child() as ComponentInstance
    expect(u.isPageConsumer(popUp)).to.be.true
  })
})
