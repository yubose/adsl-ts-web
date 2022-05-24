const webpack = require('webpack')
const chokidar = require('chokidar')
const ws = require('ws')

const cyan = (s) => `\x1b[36m${s}\x1b[0m`
const tag = `[${cyan(pluginName)}]`

class NoodlDiagnosticsWebpackPlugin {
  static pluginName = 'NoodlDiagnosticsWebpackPlugin'

  /**
   * @param { Options } options
   */
  constructor(options) {
    //
  }

  /**
   * @param { import('webpack').Compiler } compiler
   */
  apply(compiler) {
    compiler.hooks.compilation.tap(
      NoodlDiagnosticsWebpackPlugin.pluginName,
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

module.exports = NoodlDiagnosticsWebpackPlugin
