const { expect } = require('chai')
const { Action, EmitAction, Component, List, ListItem } = require('noodl-ui')
const { isEmitObj } = require('noodl-utils')

module.exports = function (chai, utils) {
  const Assertion = chai.Assertion

  Assertion.addProperty('action', function () {
    this.assert(
      this._obj instanceof Action,
      'expected #{this} to be an Action instance',
      'expected #{this} to not be an Action instance',
    )
  })

  Assertion.addMethod('actionOf', function (arg) {
    new Assertion(this._obj).to.be.instanceOf(Action)
    new Assertion(this._obj).to.have.property('actionType')

    const isActionType = (action, type) => action.actionType === 'type'

    const getCommonArgs = (type) => [
      `expected #{this} to be an action instance of actionType "${type}"`,
      `expected #{this} to not be an action instance of actionType "${type}"`,
    ]

    switch (arg) {
      case 'emit':
        return this.assert(
          isEmitObj(this._obj) || this._obj.actionType === 'emit',
          ...getCommonArgs('emit'),
        )
      case 'goto':
        return this.assert(
          'goto' in this._obj || this._obj.actionType === 'goto',
          ...getCommonArgs('goto'),
        )
      default:
        return this.assert(this._obj.actionType === arg, ...getCommonArgs(arg))
    }
  })

  Assertion.addProperty('component', function () {
    this.assert(
      this._obj instanceof Component,
      'expected #{this} to be a Component instance',
      'expected #{this} to not be a Component instance',
    )
  })
}
