// Imported by webpack.config.js
const HtmlWebpackPlugin = require('html-webpack-plugin')
const fs = require('fs-extra')
const path = require('path')

fs.ensureDirSync('generated')

const pathToLibsFile = path.resolve(path.join(__dirname, '../public/libs.html'))

class InjectScriptsPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap('InjectScriptsPlugin', (compilation) => {
      HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync(
        'InjectScriptsPlugin',
        (data, cb) => {
          if (fs.existsSync(pathToLibsFile)) {
            // Add the CDN scripts to the html
            data.html += fs.readFileSync(pathToLibsFile, { encoding: 'utf8' })
          }
          // Let webpack continue the compilation
          cb(null, data)
        },
      )
    })
  }
}

module.exports = InjectScriptsPlugin
