/// <reference types="cypress" />
// import SignIn from '../fixtures/SignIn.json'
// import BaseCSS from '../fixtures/BaseCSS.json'
// import BasePage from '../fixtures/BasePage.json'
// import BaseDataModel from '../fixtures/BaseCSS.json'

// const root = { ...BaseCSS, ...BasePage, ...BaseDataModel, ...SignIn }

const pathname = 'SignIn'
const selector = {
  countryCode: '[data-key="formData.countryCode"]',
  phoneNumber: '[data-key="formData.phoneNumber"]',
  password: '[data-key="formData.password"]',
  verificationCodeContainer: '[data-cy="verificationCodeContainer"]',
  verificationCode: '[name="verificationCodeTextField"]',
}

beforeEach(() => {
  window.localStorage.clear()
  cy.visit(`/`)
})

context('Signing in', () => {
  it('should be able to fill in their country code, phone number and password', () => {
    cy.get(selector.countryCode).select('+1')
    cy.get(selector.phoneNumber)
      .clear()
      .type('6262443444')
      .should('have.value', '6262443444')
    cy.get(selector.password)
      .clear()
      .type('142251')
      .should('have.value', '142251')
  })

  it('should prevent the submission with an error if the phone number is empty', () => {
    cy.get(selector.phoneNumber).clear()
    cy.get(selector.password).clear().type('1425555')
    cy.get(selector.countryCode).select('+1')
    cy.findByText('Sign In').click()
    cy.findByText('Phone number is required')
  })

  it.skip('should prevent the submission with an error if the phone number is invalid', () => {
    cy.get(selector.phoneNumber).clear().type('5555555555')
    cy.get(selector.password).clear().type('1425555')
    cy.get(selector.countryCode).select('+1')
    cy.findByText('Sign In').click()
    cy.findByText(/Phone number is invalid/i)
  })

  it.skip('should prevent the submission with an error if the password is empty', () => {
    cy.get(selector.phoneNumber).clear().type('6262443444')
    cy.get(selector.password).clear()
    cy.get(selector.countryCode).select('+1')
    cy.findByText('Sign In').click()
    cy.findByText(/password is required/i)
  })

  it.skip('should prevent the submission with an error if the password is too short', () => {
    cy.get(selector.phoneNumber).clear().type('6262443444')
    cy.get(selector.password).clear().type('14225')
    cy.get(selector.countryCode).select('+1')
    cy.findByText('Sign In').click()
    cy.findByText(/password must be a minimum of/i)
  })

  it.skip('should prevent the submission with an error if the verification code is incorrect', () => {
    cy.get(selector.phoneNumber).clear().type('6262443444')
    cy.get(selector.password).clear().type('1422511')
    cy.get(selector.countryCode).select('+1')
    cy.findByText('Sign In').click()
    cy.get(selector.verificationCodeContainer)
      .find(selector.verificationCode)
      .type('100000')
    cy.contains(/submit/i).click()
    cy.contains(/verification code error/i)
  })

  it.skip("should show the 'password is incorrect' alert if the phone number / password combination is incorrect", () => {
    cy.typeInLogin('6262443444', '142251')
    cy.contains('Sign In').click()
    cy.contains(/password is invalid/i)
    // return cy
    //   .login('+1 6262443444', 'some-wrong-password')
    //   .then(() => cy.contains(/password is invalid/i))
  })

  it.skip('should prevent the submission with an error if the country code isnt selected', () => {
    cy.typeInLogin('6262443444', '142251')
    cy.findByText('Sign In').click()
    cy.findByText(/country code is required/i)
  })

  it.skip('should be able submit the form when all the fields are correctly filled out', () => {
    cy.typeInLogin('6262443444', '142251')
    cy.findByText('Sign In').click()
    cy.contains(/Enter the 6-digit verification code/i)
  })

  it.skip('should show the verification code popup after pressing submit with correct field values', () => {
    cy.typeInLogin('6262443444', '142251')
    cy.findByText('Sign In').click()
    cy.findByText(
      /Enter the 6-digit verification code that was sent to your phone/i,
    )
  })

  it.skip('should prevent the verification code popup from submitting if the field is empty', () => {
    cy.typeInLogin('6262443444', '142251')
    cy.contains('Sign In').click()
    cy.get(selector.verificationCode).clear()
    cy.contains(/submit/i).click()
    cy.contains(/please enter your/i)
  })

  it.skip('should prevent the verification code popup from submitting with an error if the # of characters is less than 6', () => {
    cy.typeInLogin('6262443444', '142251')
    cy.contains('Sign In').click()
    cy.get(selector.verificationCode).type('14555')
    cy.contains(/submit/i).click()
    cy.contains(/too short/i)
  })

  it.skip('should close the verification code popup when the cancel button is clicked', () => {
    cy.typeInLogin('6262443444', '142251')
    cy.contains('Sign In').click()
    cy.get(selector.verificationCode).type('145554')
    cy.contains(/cancel/i).click()
    cy.get(selector.verificationCode).should('not.exist')
  })

  it.skip('should redirect them to create a new account if they provided a phone number that does not exist', () => {
    return cy.login('6262463492', '5988882').then(() => {
      return cy.location().should((location) => {
        return expect(/CreateNewAccount/i.test(location.pathname)).to.be.true
      })
    })
  })

  it.skip('should redirect them to the dashboard if they entered in a valid registered phone number, country code and password', () => {
    return cy.login('6262443444', '142251').then(() => {
      return cy.location().should((location) => {
        return expect(/MeetingRoomInvited/i.test(location.pathname)).to.be.true
      })
    })
  })

  it.skip('should redirect to the sign up page if the "Sign Up" button is clicked', () => {
    cy.findByText('Sign Up').click()
    return cy
      .location()
      .should(
        (location) => expect(/SignUp/i.test(location.pathname)).to.be.true,
      )
  })
})
