import { expect } from 'chai'
import chalk from 'chalk'
import Page from '../Page'

let page: Page

beforeEach(() => {
  page = new Page()
})

describe(chalk.keyword('orange')('Page'), () => {
  it(``, () => {
    console.info('Hello!')
  })
})
