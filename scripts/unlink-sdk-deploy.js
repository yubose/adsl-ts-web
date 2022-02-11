const u = require('@jsmanifest/utils')
const fs = require('fs-extra')
const path = require('path')
const execa = require('execa')
const globby = require('globby')

const currentDir = process.cwd()
const getAbsFilePath = (...s) => path.resolve(path.join(currentDir, ...s))

const pathToLvl3Repo = getAbsFilePath('../aitmed-cadl-copy')

let shell = execa.commandSync(
  `cd \"${pathToLvl3Repo}\" && ` +
    `npm unlink && ` +
    `npm run build && ` +
    `npm version patch -f && ` +
    `npm publish -f && ` +
    `cd \"${currentDir}\" && ` +
    `npm unlink -D @aitmed/cadl && ` +
    `npm i -D @aitmed/cadl@latest && ` +
    `npm run build:deploy:test`,
  {
    shell: true,
    stdio: 'inherit',
  },
)
