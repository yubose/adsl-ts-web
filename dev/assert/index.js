const n = require('noodl-core')
const ny = require('noodl-yaml')

/**
 * @typedef FactoryOptions
 * @property { Record<string, any> } data
 */

/**
 * @typedef AssertOptions
 * @type { import('noodl-yaml').RunDiagnosticsOptions }
 */

/**
 * @typedef AssertFn
 * @type {(options: AssertOptions, helpers: typeof utils) => any}
 */

const utils = {
  consts: n.consts,
  n,
  ny,
  getRefProps: n.getRefProps,
}

/**
 * @param { AssertFn } run
 * @returns { (args: AssertOptions & Record<string, any>) => any }
 */
function createAsserter(run) {
  return function assert(options) {
    return run(options, utils)
  }
}

/**
 * @param { FactoryOptions } options
 * @returns {(fn: AssertFn) => import('noodl-yaml').DocDiagnostics['run'] }
 */
function factory(options) {
  return (enter) => {
    return (opts) => enter({ ...opts, ...options }, utils)
  }
}

module.exports.createAsserter = createAsserter
module.exports.factory = factory
module.exports.helpers = utils
