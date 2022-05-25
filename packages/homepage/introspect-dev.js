const u = require('@jsmanifest/utils')
const fs = require('fs-extra')
const path = require('path')
const y = require('yaml')
const { getAbsFilePath, loadFile } = require('noodl')

const introspection = fs.readJsonSync(
  path.join(__dirname, './output/www_introspection.json'),
)

const BaseCSS = loadFile(getAbsFilePath('output/www/BaseCSS_en.yml'), 'json')
const BasePage = loadFile(getAbsFilePath('output/www/BasePage_en.yml'), 'json')
const BaseDataModel = loadFile(
  getAbsFilePath('output/www/BaseDataModel_en.yml'),
  'json',
)

const mergedPreloads = {
  ...BaseCSS,
  ...BasePage,
  ...BaseDataModel,
}

fs.writeJsonSync('mergedPreloads.json', mergedPreloads)
