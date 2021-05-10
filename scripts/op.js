const chalk = require('chalk')
const { spawn } = require('child_process')
const {
  loadFileAsDoc,
  captioning,
  coolGold,
  cyan,
  italic,
  magenta,
  orange,
  deepOrange,
  yellow,
  aquamarine,
  brightGreen,
  newline,
  purple,
  lightGold,
  lightRed,
  lightGreen,
  red,
  teal,
  highlight,
  white,
} = require('noodl-common')
const get = require('lodash/get')
const set = require('lodash/set')
const toPlainObject = require('lodash/toPlainObject')
const minimist = require('minimist')
const yaml = require('yaml')
const globby = require('globby')
const fs = require('fs-extra')
const path = require('path')

const label = (s) => aquamarine(`[${s}]`)

/** @return yaml.Document */
const getConfig = () => {
  return yaml.parseDocument(fs.readFileSync('noodl.yml', 'utf8'))
}
/** @type { yaml.YAMLMap }; @return { yaml.YAMLMap } */
const getLibAliasMap = getConfig().contents.getIn(['op', 'alias'])

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

const args = minimist(process.argv.slice(2), {
  alias: {
    s: 'start',
    b: 'build',
    c: 'convert',
    t: 'test',
    testfile: 'testfile',
  },
})

const {
  start,
  build,
  config: configId,
  convert,
  sync,
  split,
  test,
  testfile,
} = args

console.log(`\nArgs`, args)
console.log('')

const config = getConfig()

/** @type { yaml.YAMLMap } */
const op = config.contents.get('op')

/** @type { yaml.YAMLMap } */
const aliases = op.get('alias')

/** @type { yaml.YAMLMap['items'] } */
const libReg = aliases.items

if (start || build || test || testfile) {
  let label = start ? 'start' : build ? 'build' : test ? 'test' : 'test:file'
  let cmd = ``
  let cmdArgs = []
  let lib = ``

  for (const pair of libReg) {
    const obj = pair.value
    const regexStr = obj.get('regex')
    const regex = new RegExp(regexStr, 'i')
    if (regex.test(args[label])) lib = pair.key.value
  }

  if (!lib && testfile) {
    // lib = testfile.join(' ')
  }

  if (!lib) {
    throw new Error(`Required lib name for ${chalk.magenta(label)} script`)
  }

  cmd += `lerna`
  cmdArgs.push(
    'exec',
    '--scope',
    lib,
    `\"npm run ${label}${args._.join(' ')}\"`,
  )
  spawn(cmd, cmdArgs, { stdio: 'inherit', shell: true })
}

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

if (split) {
  const splitConfig = op.get('split')
  /** @type { yaml.YAMLSeq<yaml.YAMLMap<string, yaml.Node>> } */
  const pageObjectConfigs = splitConfig.get('pageObject')
  pageObjectConfigs.items.forEach((node) => {
    /** @type { yaml.Scalar<string> } */
    const dir = node.get('dir')
    const filename = node.get('filename')
    /** @type { yaml.YAMLSeq<yaml.Scalar<string>> } */
    const keys = node.get('keys')
    console.log(`KEYS: ${keys}`)
    console.log(`FILENAME: ${filename}`)
    const filepath = path.resolve(path.join(dir, filename))
    /** @type { yaml.YAMLMap } */
    const target = node.get('target')
    const targetDir = path.resolve(target.get('dir'))
    console.log(`INPUT FILEPATH: ${filepath}`)
    console.log(`TARGET DIR: ${targetDir}`)
    const doc = loadFileAsDoc(filepath)
    keys.items.forEach((key) => {
      if (doc.has(key)) {
        const value = doc.get(key)
        const saveTo = path.resolve(path.join(targetDir, `${key}.json`))
        console.log(`Saving to: ${saveTo}`)
        fs.writeJsonSync(saveTo, value, { spaces: 2 })
        doc.delete(key)
      }
    })
    fs.writeJsonSync(path.join(targetDir, filename), doc, { spaces: 2 })
  })
}

if (sync) {
  const syncDirName = sync
  const baseDir = path.join(process.cwd(), '../cadl')
  const configDir = path.join(baseDir, 'config')
  const fromDir = path.join(baseDir, syncDirName)
  const toDir = path.join(process.cwd(), './server')
  const configFileName = `${configId}.yml`
  console.log(`${label('Syncing')} from ${magenta(baseDir)}`)

  if (!fs.existsSync(toDir)) {
    fs.ensureDirSync(toDir)
    console.log(
      `${label(`New directory`)} Created a new directory at ${magenta(toDir)}`,
    )
  }

  if (!configId) {
    throw new Error(
      red(
        `Please choose a config to use (${cyan('ex:')} "${italic(
          'meet4.yml',
        )}" to use ${italic('meet4')} config)`,
      ),
    )
  }

  const start = async () => {
    try {
      console.log(
        `${label('Copying')} ${yellow(configId)} config from ${magenta(
          path.join(configDir, configFileName),
        )} to ${magenta(path.join(toDir, configFileName))}`,
      )
      await fs.copyFile(
        path.join(configDir, configFileName),
        path.join(toDir, configFileName),
      )
      const files = await fs.readdir(fromDir)
      console.log(
        `${label(`Copying`)} ${yellow(`${files.length} files`)} from ${magenta(
          fromDir,
        )}`,
      )
      await fs.copy(fromDir, toDir, {
        errorOnExist: false,
        preserveTimestamps: false,
        overwrite: true,
        recursive: true,
      })
      console.log(
        `${label(`Copied`)} ${yellow(`${files.length} files`)} to ${magenta(
          toDir,
        )}`,
      )
      console.log('')
    } catch (err) {
      console.log('')
      throw new Error(err.message)
    }
  }

  start()
}
