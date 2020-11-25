import fs from 'fs-extra'
import yaml from 'yaml'
import path from 'path'

const pathToYml = '_data/a.yml'
const yml = fs.readFileSync(
  path.resolve(path.join(process.cwd(), pathToYml)),
  'utf8',
)
const cst = yaml.parseCST(yml)

const output = String(cst[0].contents[0].items[1].node.items)

fs.writeFileSync(
  path.resolve(path.join(process.cwd(), '_data/a.output.yml')),
  output,
  'utf8',
)

console.log(output)
