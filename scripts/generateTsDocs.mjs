import * as u from '@jsmanifest/utils'
import { Application, ProjectReflection, TSConfigReader } from 'typedoc'
import path from 'path'

const log = console.log
const pathToBaseDir = path.resolve(
  path.join(process.cwd(), 'packages/noodl-types'),
)
const pathToEntryFile = path.join(pathToBaseDir, 'src/index.ts')
const pathToTsConfig = path.join(pathToBaseDir, 'tsconfig.json')

const app = new Application()
const tsConfigReader = new TSConfigReader()

app.options.addReader(tsConfigReader)

app.bootstrap({
  emit: 'docs',
  entryPoints: [pathToEntryFile],
  exclude: ['**/*.test.ts'],
  hideGenerator: true,
  logLevel: 'Verbose',
  name: 'noodl-types',
  showConfig: true,
  tsconfig: pathToTsConfig,
})

/**
 * @param { ProjectReflection } projectReflection
 */
async function callback(projectReflection) {
  try {
    log('Received ProjectReflection')

    const { packageInfo, readme } = projectReflection

    console.log({
      numSourceFiles: projectReflection.files.length,
      ref2: projectReflection.files[1].reflections[0].signatures,
    })
  } catch (error) {
    if (error instanceof Error) throw error
    throw new Error(String(error))
  }
}

app.convertAndWatch(callback)

// const projectReflection = app.convert()
// await app.generateDocs(projectReflection, './typedoc')
