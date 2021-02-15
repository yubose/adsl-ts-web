// Imported by webpack.config.js
const HtmlWebpackPlugin = require('html-webpack-plugin')
const fs = require('fs-extra')
const path = require('path')

fs.ensureDirSync('generated')

const pathToLibsFile = path.resolve(path.join(__dirname, '../public/libs.html'))
const pathToEmitDataFile = 'generated/InjectScriptsPlugin_compilationData.json'

class InjectScriptsPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap('InjectScriptsPlugin', (compilation) => {
      HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync(
        'InjectScriptsPlugin',
        (data, cb) => {
          // Save the compilation stats for analyzing
          fs.writeFileSync(
            pathToEmitDataFile,
            JSON.stringify(compiler, null, 2),
            { encoding: 'utf8' },
          )
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
