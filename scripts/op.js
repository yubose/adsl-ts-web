const chalk = require('chalk')
const get = require('lodash/get')
const set = require('lodash/set')
const toPlainObject = require('lodash/toPlainObject')
const minimist = require('minimist')
const yaml = require('yaml')
const globby = require('globby')
const fs = require('fs-extra')
const path = require('path')

// globby
//   .sync('./_data/type_ecosDoc/**/*.json', { objectMode: true })
//   .forEach(({ name, path: pathProp }) => {
//     const obj = {}
//     const filepath = path.resolve(pathProp)
//     let file = fs.readFileSync(filepath, 'utf8')
//     file = yaml.parseDocument(file)
//     const json = file.toJSON()
//     fs.writeJsonSync(filepath, json, { spaces: 2 })
//   })

const args = minimist(process.argv.slice(2))

if (args.convert) {
  const extFrom = args.convert
  const extTo = args.ext
  const [from, to] = args._
  console.log(
    `Converting ${chalk.yellow(extFrom)} files from "${chalk.cyan(
      from,
    )}" to "${chalk.yellow(extTo)}" placed in "${chalk.cyan(to)}"`,
  )
  fs.ensureDirSync(path.resolve(to))
  const files = globby.sync(path.resolve(from), {
    extglob: extFrom.replace('.', ''),
    expandDirectories: true,
    objectMode: true,
  })
  const docs = files.forEach((file) => {
    if (!file.name.endsWith(extFrom)) return
    const yml = yaml.stringify(fs.readJsonSync(path.resolve(file.path)), {
      indent: 2,
    })
    fs.writeFileSync(
      path.resolve(
        path.join(
          file.name.substring(file.name.lastIndexOf('.')),
          'yml',
          extTo,
        ),
      ),
      yml,
      'utf8',
    )
  })
  console.log(docs)
}

console.log(args)
