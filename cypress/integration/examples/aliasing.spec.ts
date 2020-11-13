/// <reference types="cypress" />
import noodl from '../../../src/app/noodl'
import noodlui from '../../../src/app/noodl-ui'
import Page from '../../../src/Page'

let SignIn
let page: Page

before(async () => {
  await noodl.init()
  page = new Page()
  page.initializeRootNode()
})

beforeEach(() => {
  cy.fixture('SignIn').then(async (obj) => {
    SignIn = obj
    await noodl.initPage('SignIn')
  })
})

describe('hello', () => {
  it('should pass', () => {
    console.log(noodl.root.SignIn)
    page.render(noodlui.resolveComponents(noodl.root.SignIn.components))
  })
})
