/// <reference types="cypress" />

describe('Meeting', () => {
  it('should go to the VideoChat page when clicking on an an "invited" row', () => {
    cy.visit('SignIn')
    return cy
      .login('6262443444', '142251')
      .then(() =>
        cy.location().should(({ pathname }) => {
          return cy
            .find('[data-name="roomName"]')
            .then(() => expect(/MeetingRoomInvited/i.test(pathname)).to.be.true)
        }),
      )
      .then(() => {
        return cy
          .find('[data-name="roomName"]')
          .click()
          .location()
          .should(
            ({ pathname }) => expect(/VideoChat/.test(pathname)).to.be.true,
          )
      })
  })
})
