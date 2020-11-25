import fs from 'fs-extra'
import yaml from 'yaml'
import { Scalar, Node, Pair, YAMLMap, YAMLSeq, Collection } from 'yaml/types'
import util from 'yaml/util'
import path from 'path'

const pathToYml = '_data/PatientChartGeneralInfo.yml'
const yml = fs.readFileSync(
  path.resolve(path.join(process.cwd(), pathToYml)),
  'utf8',
)
const ast = yaml.parseDocument(yml, { indent: 2 })
const output = getOutput()

fs.writeFileSync(
  path.resolve(path.join(process.cwd(), '_data/a.output.yml')),
  output,
  'utf8',
)

function createIf(pred, valOnTrue, valOnFalse) {
  const obj = new YAMLMap()
  const conds = new YAMLSeq()
  conds.add(pred)
  conds.add(valOnTrue)
  conds.add(valOnFalse)
  obj.set('if', conds)
  return obj
}

function createEmit<D, K extends keyof D>(opts?: {
  actions?: any[]
  dataKey?: K | D
}) {
  const obj = new YAMLMap()
  let dataKey: Scalar | YAMLMap
  const actions = new YAMLSeq()

  if (opts.actions) {
    opts.actions.forEach((action) => {
      //
    })
  }

  if (opts.dataKey) {
    if (typeof opts.dataKey === 'string') {
      dataKey
    } else {
      //
    }
  }

  const emitObj = new YAMLMap()
  obj.set('emit', emitObj)
  emitObj.set('dataKey', dataKey)
  emitObj.set('actions', actions)
  dataKey.set('var1', 'itemObject')
  const cond = new YAMLMap()
  cond.add(new Pair('.builtIn.string.equal', [{ fsafs: 'fsa' }, { asz: 22 }]))
  actions.add(createIf(cond, 'selected.png', 'unselected.png'))
  return obj
}

function createComponent(type: string) {
  const component = new YAMLMap()
  component.set('type', type)
  return component
}

function getOutput() {
  let result

  const page = new yaml.Document()
  const contents = new YAMLMap()

  contents.set('components', new YAMLSeq())
  const components = contents.get('components')
  const image = createComponent('image')
  image.set('path', createEmit({ key: 'gender', value: 'Male' }))
  components.add(image)

  page.contents = contents

  return page
}
