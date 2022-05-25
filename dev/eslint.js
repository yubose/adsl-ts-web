const { ESLint } = require('eslint')
const fs = require('fs-extra')
const path = require('path')
const u = require('@jsmanifest/utils')
const espree = require('espree')

const currentDir = __dirname
const getRelPath = (...s) => path.join(currentDir, ...s)

;(async () => {
  try {
    const ast = espree.parse(
      await fs.readFile(getRelPath('core/DocVisitor.js')),
      {
        ecmaFeatures: { jsx: false, globalReturn: true, impliedStrict: true },
        ecmaVersion: 2022,
        sourceType: 'commonjs',
      },
    )
    const eslint = new ESLint()

    const results = await eslint.lintFiles(getRelPath('core/**/*.js'))

    console.log(ast)
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    u.logError(err)
  }
})()
