process.stdout.write('\x1Bc')
const axios = require('axios').default
const y = require('yaml')
const fse = require('fs-extra')
const path = require('path')
const fg = require('fast-glob')
const n = require('@noodl/core')
const { Loader } = require('noodl')
const u = require('@jsmanifest/utils')
const ny = require('@noodl/yaml')
const { factory } = require('./assert')
const assertInit = require('./assert/init')
const assertList = require('./assert/components/list')
const assertRef = require('./assert/reference')
const assertTextBoard = require('./assert/textBoard')

/**
 * @typedef CSTTokenType
 * @type { y.CST.TokenType | y.CST.SourceToken['type'] }
 *
 * @typedef CreateCSTTokenOptions
 * @type { Parameters<typeof y.CST.createScalarToken>[1] }
 */

const lexer = new y.Lexer()
const composer = new y.Composer()
const parser = new y.Parser()
// const factory = ny.factory
const getFilePath = (...s) => path.join(__dirname, ...s)
const is = ny.is
const fs = ny.createFileSystem(function getFs() {
  return {
    ...fse,
    getBaseName: path.basename,
    isAbsolute: path.isAbsolute,
  }
})

// const yml = fs.readFile(filepath)
// const ast = fs.readAst(filepath)
// const cst = fs.readCst(filepath)
const docRoot = new ny.DocRoot()
const docVisitor = new ny.DocVisitor()
const diagnostics = new ny.DocDiagnostics()
const pathToGeneratedDir = getFilePath('../generated')

// const configKey = 'admind3'
// const pathToAppDir = `../generated/${configKey}`
// const pathToRootConfigFile = `../generated/${configKey}/${configKey}.yml`
// const pathToAppConfigFile = `../generated/${configKey}/cadlEndpoint.yml`
// const pathToAssetsDir = `../generated/${configKey}/assets`
// const ymlFilepaths = fg.sync(getFilePath(pathToAppDir, '**/*.yml'))
// const filteredPages = ymlFilepaths.filter((filepath) => {
//   return /base|sign|menu|cov19/i.test(filepath)
// })

docRoot.use(fs)

// function loadPages() {
//   filteredPages.forEach((filepath) => {
//     console.log(filepath)
//     docRoot.loadFileSync(filepath, {
//       renameKey: (filename) => {
//         if (filename.endsWith('.yml')) {
//           return filename.replace('.yml', '')
//         }
//       },
//     })
//   })
// }

diagnostics.use(docRoot)
diagnostics.use(docVisitor)

async function runDiagnosticsbyConfig({ baseUrl, configKey }) {
  try {
    const data = {}
    // const { data: yml } = await axios.get(`https://public.aitmed.com/config/${configKey}.yml`)
    const loader = new Loader({
      config: configKey,
      deviceType: 'web',
      env: 'stable',
      version: 'latest',
    })

    const [rootDoc, appDoc] = await loader.init({
      ...(baseUrl
        ? { dir: path.join(pathToGeneratedDir, configKey) }
        : undefined),
      loadPages: true,
      loadPreloadPages: true,
      spread: ['BaseCSS', 'BasePage', 'BaseDataModel', 'BaseMessage'],
    })

    docRoot.set(configKey, rootDoc)
    docRoot.set('cadlEndpoint', appDoc)

    for (const [name, doc] of loader.root) {
      docRoot.set(
        name,
        y.parseDocument(doc.toString(), {
          logLevel: 'debug',
          prettyErrors: true,
          keepSourceTokens: true,
        }),
      )
    }

    const enter = factory({ data })
    const visitedPages = []

    const results = diagnostics.run({
      enter: enter(
        (
          { add, data, key, name: page, value: node, root, path: nodePath },
          utils,
        ) => {
          if (!visitedPages.includes(page)) visitedPages.push(page)
          if (is.pairNode(node) && ny.unwrap(node.key) === 'init') {
            return assertInit({ add, node: node.value, page, root }, utils)
          } else if (is.scalarNode(node)) {
            if (is.reference(node)) {
              return assertRef({ add, node, page, root }, utils)
            }
          } else if (is.mapNode(node)) {
            if (is.list(node)) {
              return assertList({ add, node, page, root }, utils)
            }

            if (node.has('textBoard')) {
              assertTextBoard({ add, node, page, root }, utils)
            }
          }
        },
      ),
    })

    console.log(`Visited pages: ${visitedPages.join(', ')}`)

    return results
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    u.logError(err)
  }
}

// runDiagnosticsbyConfig('admind3').then((results) => {
//   console.log(`${u.yellow(results).length} diagnostic messages`)
//   // fs.writeFile(path.join(__dirname, 'SignIn.yml'), SignInYml)
//   // fs.writeFile(path.join(__dirname, 'Topo.yml'), TopoYml)
//   fs.writeJson(path.join(__dirname, 'diagnostics.json'), results, { spaces: 2 })
// })

// const builtInStringEqualToken = [
//   factory.newline({
//     indent: 0,
//     offset: 0,
//   }),
//   factory.document({
//     offset: 1,
//     start: [],
//     value: factory.blockMap({
//       offset: 1,
//       indent: 0,
//       items: [
//         {
//           start: [],
//           key: factory.scalar({
//             offset: 1,
//             indent: 0,
//             source: 'SignIn',
//           }),
//           sep: [
//             factory.mapColon({
//               offset: 'SignIn'.length + 1,
//               indent: 0,
//               source: ':',
//             }),
//             factory.newline({
//               offset: 8,
//               indent: 0,
//             }),
//             factory.space({ offset: 9, indent: 0, source: ' ' }),
//           ],
//           value: factory.blockMap({
//             offset: 11,
//             indent: 2,
//             items: [
//               {
//                 start: [],
//                 key: factory.scalar({
//                   offset: 1,
//                   indent: 0,
//                   source: 'SignIn',
//                 }),
//                 sep: [
//                   factory.mapColon({
//                     offset: 'SignIn'.length + 1,
//                     indent: 0,
//                     source: ':',
//                   }),
//                   factory.newline({
//                     offset: 8,
//                     indent: 0,
//                   }),
//                   factory.space({ offset: 9, indent: 0, source: ' ' }),
//                 ],
//                 value: factory.scalar('hello'),
//               },
//             ],
//           }),
//         },
//       ],
//     }),
//   }),
// ]

// const cstTokens = builtInStringEqualToken
// const documents = parser.parse(y.CST.stringify(cstTokens))
// const json = cstTokens
// const yml = composer.compose(documents)
// console.log(yml)

// const exampleCstTokens = parser.parse(input)
// const exampleJson = y.parse(y.stringify(exampleCstTokens))
// // const exampleYml = y.stringify(exampleJson)

// const cstTokensOutputPath = path.join(__dirname, './cstTokens.json')
// const cstJsonOutputPath = path.join(__dirname, './cst.json')
// const cstYmlOutputPath = path.join(__dirname, './cst.yml')

// fs.writeJsonSync(cstTokensOutputPath, exampleJson, { spaces: 2 })
// fs.writeJsonSync(cstJsonOutputPath, json, { spaces: 2 })
// fs.writeFileSync(cstYmlOutputPath, yml, 'utf8')

module.exports.composer = composer
module.exports.lexer = lexer
module.exports.parser = parser
module.exports.runDiagnosticsbyConfig = runDiagnosticsbyConfig
