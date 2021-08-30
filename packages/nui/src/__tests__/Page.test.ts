import { expect } from 'chai'
import { prettyDOM } from '@testing-library/dom'
import { h } from 'snabbdom'
import * as u from '@jsmanifest/utils'
import * as nc from 'noodl-common'
import * as nt from 'noodl-types'
import * as nu from 'noodl-utils'
import { ui } from './test-utils'
import NuiPage from '../Page'

let page: NuiPage

beforeEach(() => {
  page = new NuiPage()
})

describe(nc.coolGold(`NuiPage`), () => {
  it(nc.italic(`should render elements to the DOM`), () => {
    page.render(ui.button({ id: 'f' }))
    console.info(prettyDOM())
    expect(document.querySelector('button')).to.exist
  })
})
