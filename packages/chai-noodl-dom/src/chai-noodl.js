const {
  Action,
  ActionChain,
  EmitAction,
  Component,
  List,
  ListItem,
} = require('noodl-ui')
const { isListConsumer, isListKey, isReference } = require('noodl-utils')

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
          this._obj instanceof EmitAction,
          `expected #{this} to be an EmitAction instance`,
          `expected #{this} to not be an EmitAction instance`,
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

  Assertion.addProperty('actionChain', function () {
    this.assert(
      this._obj instanceof ActionChain,
      'expected #{this} to be an ActionChain instance',
      'expected #{this} to not be an ActionChain instance',
    )
  })

  Assertion.addProperty('component', function () {
    this.assert(
      this._obj instanceof Component,
      'expected #{this} to be a Component instance',
      'expected #{this} to not be a Component instance',
    )
  })

  Assertion.addProperty('listComponent', function () {
    this.assert(
      this._obj instanceof List,
      'expected #{this} to be a List instance',
      'expected #{this} to not be a List instance',
    )
  })

  Assertion.addProperty('listItemComponent', function () {
    this.assert(
      this._obj instanceof ListItem,
      'expected #{this} to be a ListItem instance',
      'expected #{this} to not be a ListItem instance',
    )
  })

  Assertion.addProperty('listKey', function () {
    new Assertion(this._obj).to.be.a('string')
    this.assert(
      isListKey(this._obj),
      'expected #{this} to be a list key',
      'expected #{this} to not be a list key',
    )
  })

  Assertion.addProperty('listConsumer', function () {
    new Assertion(this._obj).to.be.instanceOf(Component)
    this.assert(
      isListConsumer(this._obj),
      'expected #{this} to be a list consumer',
      'expected #{this} to not be a list consumer',
    )
  })

  Assertion.addProperty('reference', function () {
    new Assertion(this._obj).to.be.a('string')
    this.assert(
      isReference(this._obj),
      'expected #{this} to be a reference',
      'expected #{this} to not be a reference',
    )
  })
}
