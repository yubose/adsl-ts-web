const { spawn, exec, execFile } = require('child_process')
const chalk = require('chalk')

/**
 *
 * @param { import('./op') } props
 */
async function convert(props) {
  console.log('props', props)

  try {
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
  } catch (error) {
    throw new Error(error.message)
  }
}

module.exports = convert
