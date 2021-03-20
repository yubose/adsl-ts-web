import { expect } from 'chai'
import sinon from 'sinon'
import chalk from 'chalk'
import Page from '../Page'
import { ndom } from '../test-utils'

let page: Page

beforeEach(() => {
  page = ndom.page
  page.setPreviousPage('Hello').setCurrentPage('Cereal')
})

describe(chalk.italic(chalk.keyword(`navajowhite`)(`Page`)), () => {
  describe(chalk.italic(chalk.white(`when navigating too fast`)), () => {
    it(
      `should prevent prevent the second navigate request of the same page if it was ` +
        `happening to soon`,
      async () => {
        const spy = sinon.spy(page, 'navigate')
        page.requestPageChange('Red', { delay: 1000 })
        await page.requestPageChange('Red', { delay: 1000 })
        expect(spy).to.be.calledOnce
        spy.restore()
      },
    )
  })
})
