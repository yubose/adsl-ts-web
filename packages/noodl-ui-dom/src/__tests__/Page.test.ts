import * as u from '@jsmanifest/utils'
import { AcceptArray } from '@jsmanifest/typefest'
import { NUI } from 'noodl-ui'
import { expect } from 'chai'
import { coolGold, italic } from 'noodl-common'
import { _defaults, createRender, ndom } from '../test-utils'
import { BASE_PAGE_URL } from '../constants'
import Page from '../Page'

const createPage = ({ pageUrl }: { pageUrl?: AcceptArray<string> } = {}) => {
  const page = new Page(NUI.createPage())
  if (pageUrl) {
    u.arrayEach(pageUrl, (part) => {
      if (page.pageUrl === BASE_PAGE_URL) page.pageUrl += part
      else page.pageUrl += `-${part}`
    })
  }
  return page
}

afterEach(() => {
  ndom.page?.reset()
})

describe.only(coolGold(`Page`), () => {
  it(`should initiate the pageUrl with "${BASE_PAGE_URL}"`, () => {
    const page = createPage()
    expect(page.pageUrl).to.eq(BASE_PAGE_URL)
  })

  xit(`should change the pageUrl expectedly when navigating`, async () => {
    const { page } = createRender({ components: [] })
    expect(page.pageUrl).to.eq(BASE_PAGE_URL)
    page.requesting = 'Abc'
    expect(page.pageUrl).to.eq(`${BASE_PAGE_URL}Abc`)
    expect(page.getPreviousPage('SignIn')).to.eq('Abc')
  })
})
