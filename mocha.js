require('ts-node/register')
const register = require('@babel/register').default
const fs = require('fs')
const Mocha = require('mocha')
const babel = require('@babel/core')
const path = require('path')

register({ extensions: ['.ts'] })

const filename = 'noodlDOM.test.ts'
const testsDir = `src/__tests__`
const testFiles = fs.readdirSync(testsDir)
const mocha = new Mocha({
  color: true,
  fullTrace: true,
})

testFiles.forEach(
  (file) => file.endsWith('.ts') && mocha.addFile(path.join(testsDir, file)),
)

const transformedCode = babel.transformFileSync(path.join(testsDir, filename), {
  filename,
  presets: ['@babel/preset-typescript', '@babel/preset-env'],
  plugins: [
    'lodash',
    '@babel/plugin-transform-runtime',
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    ['@babel/plugin-proposal-private-methods', { loose: true }],
  ],
  // sourceMaps: 'inline',
})

mocha.checkLeaks()
// Run the tests.
mocha.run(function (failures) {
  process.exitCode = failures ? 1 : 0 // exit with non-zero status if there were failures
})
