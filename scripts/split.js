const { spawn, exec, execFile } = require('child_process')
const chalk = require('chalk')

/**
 *
 * @param { import('./op') } props
 */
async function split(props) {
  console.log('props', props)

  try {
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
  } catch (error) {
    throw new Error(error.message)
  }
}

module.exports = split
