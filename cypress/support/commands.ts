// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.s
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })
import { Account } from '../../src/app/client'
import '@testing-library/cypress/add-commands'

Cypress.Commands.add('typeInLogin', (phoneNumber: string, password: string) => {
  cy.get('[data-key="formData.countryCode"]').select('+1')
  cy.get('[data-key="formData.phoneNumber"]').clear().type(phoneNumber)
  cy.get('[data-key="formData.password"]').clear().type(password)
})

Cypress.Commands.add('login', (phoneNumber: string, password: string) => {
  return cy.typeInLogin(phoneNumber, password).then(() =>
    cy
      .findByText('Sign In')
      .click()
      .then(() => {
        return Account.requestVerificationCode('+1 ' + phoneNumber).then(
          (code) => {
            return cy
              .get('[data-cy="verificationCodeContainer"]')
              .find('[name="verificationCodeTextField"]')
              .type(code)
              .then(() => cy.contains(/submit/i).click())
          },
        )
      }),
  )
})
