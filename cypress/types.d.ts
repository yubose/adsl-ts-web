/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    dataKey(value: string): Chainable<Element>
    dataListId(value: string): Chainable<Element>
    dataName(value: string): Chainable<Element>
    dataValue(value: string): Chainable<Element>
    dataUx(value: string): Chainable<Element>
  }
}
