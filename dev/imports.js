const _ = require('lodash')
const u = require('@jsmanifest/utils')
const fs = require('fs-extra')
const path = require('path')
const { parse } = require('parse-imports-ts')
const fg = require('fast-glob')

const pkgName = `noodl-loader`

const entryPoints = []

for (const filepath of fg.sync([`packages/${pkgName}/src/**/*.ts`], {
  ignore: ['**/*/__tests__'],
})) {
  console.log(`Adding entry point: ${u.yellow(filepath)}`)
  entryPoints.push(filepath)
}

const srcCodes = _.flatten(
  entryPoints.map((entryPoint) => parse(fs.readFileSync(entryPoint, 'utf8'))),
)

const importedPackages = {}

for (const { name, type } of srcCodes) {
  if (!importedPackages[name]) importedPackages[name] = { count: 0, type: {} }

  importedPackages[name].count++

  if (!(type in importedPackages[name].type)) {
    importedPackages[name].type[type] = 0
  }

  importedPackages[name].type[type]++
}

console.log(`Imported packages`, importedPackages)
