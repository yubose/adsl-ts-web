const fs = require('fs-extra')
const fg = require('fast-glob')
const path = require('path')
const u = require('@jsmanifest/utils')
const n = require('noodl-core')
const nt = require('noodl-types')
const nu = require('noodl-utils')
const y = require('yaml')
const { DocRoot, DocVisitor, is } = require('noodl-yaml')
const ObjIterator = require('./ObjIterator')
const ObjVisitor = require('./ObjVisitor')
const validators = require('./validators')

const getRelPath = (...s) => path.resolve(path.join(__dirname, ...s))

const diagnostics = new n.Diagnostics()
const docRoot = new DocRoot()
const docVisitor = new DocVisitor()

diagnostics.use(docVisitor)
diagnostics.use(docRoot)

const getNodeType = (node) => {
  if (y.isSeq(node)) return 'array'
  if (y.isMap(node)) return 'object'
  if (y.isScalar(node)) return typeof node.value
  if (y.isDocument(node)) return 'object'
  return 'unknown'
}

const getValidations = (args) => {
  /** @type {{ type: any; message: any; pageName: string; category: string }[]} */
  const validations = []

  if ('node' in args) {
    for (const config of validators) {
      u.array(config).forEach(({ validate }) => {
        const validation = validate(args)
        u.array(validation).forEach((validation) => {
          if (validation) {
            validations.push({
              ...validation,
              pageName: args.pageName,
              // category: ,
              parentType: getNodeType(args.path[args.path.length - 2]),
            })
          }
        })
      })
    }
  }

  // if (validations.length) console.log(validations)

  return validations
}

const loadDir = (p) =>
  fg.sync(p).reduce((acc, fpath) => {
    const name = path.parse(fpath).name.replace('_en', '')
    const yml = fs.readFileSync(fpath, 'utf8')
    const doc = y.parseDocument(yml)
    if (/basecss|basepage|basedatamodel|basemessage/i.test(fpath)) {
      const mapNode = y.isMap(doc?.contents) ? doc.contents : doc
      if (mapNode) {
        mapNode.items.forEach((pair) => {
          acc[pair.key.value] = pair.value
        })
      } else {
        console.error(
          u.red(
            `A doc named "${name}" was expected to spread it keys to the root object but it was not a YAMLMap`,
          ),
        )
      }
    } else {
      acc[name] = doc
      if (acc[name].has(name)) acc[name] = acc[name].get(name)
    }
    return acc
  }, {})

//
;(async () => {
  try {
    const glob = path.resolve('generated/admind3/**/*SignIn.yml')
    const docsTable = loadDir(glob)

    u.entries(docsTable).forEach(([name, doc]) => docRoot.set(name, doc))

    const results = diagnostics.run({
      enter: ({ name: pageName, key, value: node, path, data, add, root }) => {
        if (!data[pageName]) data.pageName = []
        getValidations({
          key,
          node,
          path,
          data,
          pageName,
          root,
        }).forEach((validation) => {
          add({
            pageName,
            key,
            value: node,
            messages: [validation],
          })
        })
      },
    })

    await fs.writeJson('diagnostics.json', results, { spaces: 2 })
  } catch (error) {
    throw error instanceof Error ? error : new Error(String(error))
  }
})()

// const results = diagnostics.run({
//   beforeEnter: ([name, value]) => [name, value],
//   enter: ({ name: pageName, key, value: node, path, data, add }) => {
//     if (!data[pageName]) data.pageName = []

//     if (u.isObj(node)) {
//       const keys = u.keys(node)

//       for (const key of keys) {
//         if (nt.userEvent.includes(key)) {
//           let value = node[key]
//           const evtName = key

//           if (!value) {
//             add({
//               key: evtName,
//               value,
//               messages: [
//                 {
//                   type: 'error',
//                   message: `The user event "${evtName}" is empty. Expected an object or an array of objects`,
//                 },
//               ],
//             })
//           }
//         }
//       }

//       if ('goto' in node) {
//         const goto = node.goto
//         if (!goto) {
//           add({
//             key: 'goto',
//             value: goto,
//             messages: [
//               {
//                 type: 'warn',
//                 message: `Expected a string for goto destination`,
//               },
//             ],
//           })
//         }
//       }

//       if ('path' in node) {
//         const pathNode = node.path
//         if (pathNode) {
//           if (u.isObj(pathNode)) {
//             if ('emit' in pathNode) {
//               const emit = pathNode.emit
//               if (u.isObj(emit)) {
//                 const actions = emit.actions
//                 const dataKey = emit.dataKey
//                 console.log({ actions, dataKey })
//               }
//             }
//           }
//         }
//       }
//     }
//   },
// })
