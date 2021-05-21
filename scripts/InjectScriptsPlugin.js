// Imported by webpack.config.js
const { Compiler } = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const fs = require('fs-extra')
const path = require('path')

const pluginName = 'InjectScriptsPlugin'

const cyan = (s) => `\x1b[36m${s}\x1b[0m`
const tag = `[${cyan(pluginName)}]`

/**
 * @typedef Options
 * @type { object }
 * @property { string } path
 */

class InjectScriptsPlugin {
  static pluginName = pluginName

  /**
   * @param { Options } options
   */
  constructor({ path: pathProp } = {}) {
    if (!pathProp) {
      throw new Error(`The "path" argument is required`)
    }
    const filepath = path.resolve(pathProp)
    if (!fs.existsSync(filepath)) {
      throw new Error(`${tag} The path "${filepath}" does not exist`)
    }
    this.path = pathProp
  }

  /** @param { Compiler } compiler */
  apply(compiler) {
    compiler.hooks.compilation.tap(
      InjectScriptsPlugin.pluginName,
      (compilation) => {
        HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync(
          InjectScriptsPlugin.pluginName,
          (data, cb) => {
            if (fs.existsSync(this.path)) {
              // Add the CDN scripts to the html
              data.html += fs.readFileSync(
                path.resolve(path.join(process.cwd(), this.path)),
                { encoding: 'utf8' },
              )
            }
            // Let webpack continue the compilation
            cb(null, data)
          },
        )
      },
    )
  }
}

module.exports = InjectScriptsPlugin
