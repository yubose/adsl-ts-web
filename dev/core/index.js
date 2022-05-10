const fs = require('fs-extra')
const path = require('path')
const u = require('@jsmanifest/utils')
const n = require('@noodl/core')
const nt = require('noodl-types')
const nu = require('noodl-utils')
const y = require('yaml')
const DocIterator = require('./DocIterator')
const DocVisitor = require('./DocVisitor')
const ObjIterator = require('./ObjIterator')
const ObjVisitor = require('./ObjVisitor')
const introspection = require(`../../packages/homepage/output/www_introspection.json`)

const is = { ...nt.Identify }
const getRelPath = (...s) => path.resolve(path.join(__dirname, ...s))
const loadDoc = (filepath) =>
  y.parseDocument(fs.readFileSync(getRelPath(filepath), 'utf8'))

class Root extends n.ARoot {
  value = new Map()

  get(key) {
    return this.value.get(key)
  }

  set(key, value) {
    this.value.set(key, value)
    return this
  }
}

const root = new Root()
const docIter = new DocIterator()
const docVisitor = new DocVisitor()
const diagnostics = new n.Diagnostics()
const objIter = new ObjIterator()
const objVisitor = new ObjVisitor()

diagnostics.use(objIter)
diagnostics.use(objVisitor)
// diagnostics.use(docIter)
// diagnostics.use(docVisitor)
diagnostics.use(root)

// const data = {
//   BaseCSS: loadDoc('../../generated/admind3/BaseCSS.yml'),
//   SignIn: loadDoc('../../generated/admind3/SignIn.yml'),
// }
// root.set('AiTmedAdmin', introspection.AiTmedAdmin)
// root.set('AiTmedContact', introspection.AiTmedContact)
// root.set('AiTmedAdmin', data.AiTmedAdmin)
// root.set('AiTmedContact', data.AiTmedContact)

//
;(async () => {
  try {
    // const objOfDocs = u
    //   .entries({
    //     AiTmedAdmin: introspection.AiTmedAdmin,
    //     AiTmedContact: introspection.AiTmedContact,
    //   })
    //   .reduce((acc, [name, obj]) => {
    //     acc[name] = y.parseDocument(y.stringify(obj))
    //     return acc
    //   }, {})

    const results = diagnostics.run(
      {
        AiTmedAdmin: introspection.AiTmedAdmin,
        AiTmedContact: introspection.AiTmedContact,
      },
      {
        beforeEnter: ([name, value]) => [name, value],
        enter: ({ name: pageName, key, value: node, path, data, add }) => {
          if (!data[pageName]) data.pageName = []

          if (u.isObj(node)) {
            const keys = u.keys(node)

            for (const key of keys) {
              if (nt.userEvent.includes(key)) {
                let value = node[key]
                const evtName = key

                if (!value) {
                  add({
                    key: evtName,
                    value,
                    messages: [
                      {
                        type: 'error',
                        message: `The user event "${evtName}" is empty. Expected an object or an array of objects`,
                      },
                    ],
                  })
                }
              }
            }

            if ('goto' in node) {
              const goto = node.goto
              if (!goto) {
                add({
                  key: 'goto',
                  value: goto,
                  messages: [
                    {
                      type: 'warn',
                      message: `Expected a string for goto destination`,
                    },
                  ],
                })
              }
            }

            if ('path' in node) {
              const pathNode = node.path
              if (pathNode) {
                if (u.isObj(pathNode)) {
                  if ('emit' in pathNode) {
                    const emit = pathNode.emit
                    if (u.isObj(emit)) {
                      const actions = emit.actions
                      const dataKey = emit.dataKey
                      console.log({ actions, dataKey })
                    }
                  }
                }
              }
            }
          }
        },
      },
    )

    // const results = diagnostics.run(objOfDocs, {
    //   beforeEnter: ([name, value]) => [name, value],
    //   enter: ({ name: pageName, key, value: node, path, data, add }) => {
    //     if (!data[pageName]) data.pageName = []

    //     if (y.isPair(node)) {
    //       if (y.isScalar(node.key)) {
    //         if (u.isStr(node.key.value)) {
    //           if (nt.userEvent.includes(node.key.value)) {
    //             let value = node.value
    //             if (y.isScalar(value)) {
    //               value = value.value
    //               const evtName = node.key.value

    //               if (!value) {
    //                 add({
    //                   key: evtName,
    //                   value,
    //                   messages: [
    //                     {
    //                       type: 'error',
    //                       message: `The user event "${evtName}" is empty. Expected an object or an array of objects`,
    //                     },
    //                   ],
    //                 })
    //               }
    //             }
    //           }
    //         }
    //       }
    //     }

    //     if (y.isMap(node)) {
    //       if (node.has('goto')) {
    //         const goto = node.get('goto')
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

    //       if (node.has('path')) {
    //         const pathNode = node.get('path')

    //         if (pathNode) {
    //           if (y.isMap(pathNode)) {
    //             if (pathNode.has('emit')) {
    //               const emit = pathNode.get('emit')
    //               if (y.isMap(emit)) {
    //                 const actions = emit.get('actions')
    //                 const dataKey = emit.get('dataKey')
    //                 console.log({ actions, dataKey })
    //               }
    //             }
    //           }
    //         }
    //       }
    //     }
    //   },
    // })

    console.dir(results, { depth: Infinity })

    await fs.writeJson('diagnostics.json', results, { spaces: 2 })
  } catch (error) {
    throw error instanceof Error ? error : new Error(String(error))
  }
})()
