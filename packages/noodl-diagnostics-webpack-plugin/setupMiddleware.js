const webpack = require('webpack')
const chokidar = require('chokidar')
const ws = require('ws')

/**
 * @param { (devServer: import('webpack-dev-server')['server']) => void } fn
 */
function onAfterSetupMiddleware(fn) {
  /**
   *
   * @param { import('webpack-dev-server')['server'] } devServer
   */
  return function (devServer) {
    return fn(devServer)
  }
}

module.exports = onAfterSetupMiddleware
