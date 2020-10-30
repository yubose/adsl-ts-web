const fs = require('fs')
const Mocha = require('mocha')
const babel = require('@babel/core')
const path = require('path')

const filename = 'noodlDOM.test.ts'
const testsDir = `src/__tests__`
const testFiles = [...fs.readdirSync(testsDir)]
const mocha = new Mocha()

testFiles.forEach(
  (file) => file.endsWith('.ts') && mocha.addFile(path.join(testsDir, file)),
)

babel
  .transformFile(path.join(testsDir, filename), {
    filename,
    presets: ['@babel/preset-env', '@babel/preset-typescript'],
    plugins: [
      'lodash',
      '@babel/plugin-transform-runtime',
      ['@babel/plugin-proposal-class-properties', { loose: true }],
      ['@babel/plugin-proposal-private-methods', { loose: true }],
    ],
    sourceMaps: 'inline',
  })
  .then((f) => {
    transformedCode(f)
  })

console.info(transformedCode)

// Run the tests.
mocha.run(function (failures) {
  process.exitCode = failures ? 1 : 0 // exit with non-zero status if there were failures
})
