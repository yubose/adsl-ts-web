/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable<Subject> {
    /**
     * Selects the US country code, types in the phoneNumber and password
     * after querying them using the data-key selectors
     * @param { string } phoneNumber - Phone number
     * @param { string } password - Password
     */
    typeInLogin(phoneNumber: string, password: string): Chainable<Element>

    login(phoneNumber: string, password: string): Promise<any>
  }
}
