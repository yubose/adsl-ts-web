process.stdout.write('\x1Bc')
const axios = require('axios').default
const y = require('yaml')
const fse = require('fs-extra')
const path = require('path')
const fg = require('fast-glob')
const { Loader } = require('noodl')
const n = require('@noodl/core')
const u = require('@jsmanifest/utils')
const ny = require('@noodl/yaml')

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
const factory = ny.factory
const is = ny.is
const getFilePath = (...s) => path.join(__dirname, ...s)

const fs = ny.createFileSystem(function getFs() {
  return {
    ...fse,
    getBaseName: path.basename,
    isAbsolute: path.isAbsolute,
  }
})

const filepath = path.join(__dirname, '../generated/admind3/BasePage.yml')
const SignInYml = `SignIn:
  init: null
  buttonText: Send!
  formData:
    profile:
      user:
        name: Bob
        age: 30
        gender: .Topo.selectedGender

`
const TopoYml = `Topo:
  init:
    - ..selectedGender: Other
  fruits:
    - apple
  selectedGender: ''
  genders:
    - value: female
      label: Female
    - value: male
      label: Male
    - value: other
      label: Other
  components:
    - type: view
      children:
        - type: scrollView
          children:
            - type: list
              iteratorVar: itemObject
              listObject: ..genders
              children:
                - type: listItem
                  itemObject: ''
                  children:
                    - type: label
                      dataKey: itemObject.label
                    - type: textField
                      dataKey: itemObject.value
            - type: button
              text: .SignIn.buttonText
`

// const yml = fs.readFile(filepath)
// const ast = fs.readAst(filepath)
// const cst = fs.readCst(filepath)
const docRoot = new ny.DocRoot()
const docVisitor = new ny.DocVisitor()
const diagnostics = new ny.DocDiagnostics()

const configKey = 'admind3'
const pathToAppDir = `../generated/${configKey}`
const pathToRootConfigFile = `../generated/${configKey}/${configKey}.yml`
const pathToAppConfigFile = `../generated/${configKey}/cadlEndpoint.yml`
const pathToAssetsDir = `../generated/${configKey}/assets`
const ymlFilepaths = fg.sync(getFilePath(pathToAppDir, '**/*.yml'))
const filteredPages = ymlFilepaths.filter((filepath) => {
  return /base|sign|menu|cov19/i.test(filepath)
})

docRoot.use(fs)

function loadPages() {
  // docRoot.set(
  //   'SignIn',
  //   y
  //     .parseDocument(SignInYml, {
  //       logLevel: 'debug',
  //       keepSourceTokens: true,
  //       prettyErrors: true,
  //     })
  //     .get('SignIn'),
  // )
  // docRoot.set(
  //   'Topo',
  //   y
  //     .parseDocument(TopoYml, {
  //       logLevel: 'debug',
  //       keepSourceTokens: true,
  //       prettyErrors: true,
  //     })
  //     .get('Topo'),
  // )
  filteredPages.forEach((filepath) => {
    console.log(filepath)
    docRoot.loadFileSync(filepath, {
      renameKey: (filename) => {
        if (filename.endsWith('.yml')) {
          return filename.replace('.yml', '')
        }
      },
    })
  })
}

diagnostics.use(docRoot)
diagnostics.use(docVisitor)

function assertInit({ add, node, page }) {
  if (is.seqNode(node)) {
    //
  } else if (is.scalarNode(node) && is.reference(node)) {
    //
  } else {
    if (!ny.unwrap(node)) {
      console.log(node)
      add({
        node,
        messages: [
          {
            type: n.consts.ValidatorType.ERROR,
            message: `Init should not be empty`,
          },
        ],
        page,
      })
    } else {
      add({
        node,
        messages: [
          {
            type: n.consts.ValidatorType.WARN,
            message: `Expected an array or reference string but received ${ny.getJsType(
              node,
            )}`,
          },
        ],
        page,
      })
    }
  }
}

function assertRef({ add, node, page, root }) {
  const derefed = ny.deref({ node: node, root, rootKey: page })
  const refProps = n.getRefProps(node.value)
  const isLocal = refProps.isLocalRef

  if (!derefed.value) {
    const locLabel = isLocal ? 'Local' : 'Root'
    const messages = []
    const ref = refProps.ref
    const using = isLocal ? ` using root key '${page}'` : ''

    if (root.has(page)) {
      // messages.push({
      //   type: n.consts.ValidatorType.WARN,
      //   message: `${locLabel} reference '${ref}' resolved to an empty value${using}`,
      // })
    } else {
      messages.push({
        type: n.consts.ValidatorType.ERROR,
        message: `${locLabel} reference '${ref}' could not be resolved${using}`,
      })
    }

    if (messages.length) {
      add({ messages, node, page, ...refProps })
    }
  }
}

function assertListComponent({ add, node, page }) {
  if (is.mapNode(node)) {
    const listObject = node.get('listObject', true)

    if (is.scalarNode(listObject)) {
      if (is.reference(listObject)) {
        const refProps = n.getRefProps(listObject.value)
        add({
          node: listObject,
          messages: [
            {
              type: n.consts.ValidatorType.INFO,
              message: `A list component is using its listObject as a reference`,
            },
          ],
          page,
          ...refProps,
        })
      }
    }
  } else {
    add({
      messages: [
        {
          type: n.consts.ValidatorType.WARN,
          message: `List components should be an object`,
        },
      ],
      node,
      page,
    })
  }
}

async function runDiagnosticsbyConfig(configKey) {
  try {
    // const { data: yml } = await axios.get(`https://public.aitmed.com/config/${configKey}.yml`)
    const loader = new Loader({
      config: configKey,
      deviceType: 'web',
      env: 'stable',
      version: 'latest',
    })

    const [rootDoc, appDoc] = await loader.init({
      loadPages: true,
      loadPreloadPages: true,
      spread: ['BaseCSS', 'BasePage', 'BaseDataModel', 'BaseMessage'],
    })

    docRoot.set('admind3', rootDoc)
    docRoot.set('cadlEndpoint', appDoc)

    for (const [name, doc] of loader.root) {
      docRoot.set(name, doc)
    }

    return diagnostics.run({
      enter: ({ add, data, key, name: page, value, root, path: nodePath }) => {
        if (is.pairNode(value) && ny.unwrap(value.key) === 'init') {
          assertInit({ add, node: value.value, page, root })
        } else if (is.scalarNode(value)) {
          if (ny.is.reference(value)) {
            assertRef({ add, node: value, page, root })
          }
        } else if (is.mapNode(value)) {
          if (is.list(value)) {
            assertListComponent({ add, node: value, page, root })
          }
        }
      },
    })
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    u.logError(err)
  }
}

runDiagnosticsbyConfig('admind3').then((results) => {
  // fs.writeFile(path.join(__dirname, 'SignIn.yml'), SignInYml)
  // fs.writeFile(path.join(__dirname, 'Topo.yml'), TopoYml)
  fs.writeJson(path.join(__dirname, 'diagnostics.json'), results, { spaces: 2 })
})

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
