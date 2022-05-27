process.stdout.write('\x1Bc')
const u = require('@jsmanifest/utils')
const y = require('yaml')

const yml = `
SignIn:
  formData:
    profile:
      username: bob123
      avatar: abc.png
  components:
    - type: label
      textBoard:
        - text: hello
        - br: null
        - text: good morning
`

let doc = y.parseDocument(yml, {
  logLevel: 'debug',
  keepSourceTokens: true,
  prettyErrors: true,
})

let json = doc.toJSON()

// json = new Proxy(json, {
//   get(target, property, receiver) {
//     console.log({ target, property, receiver })
//   },
// })

doc = new Proxy(doc, {
  get(target, property, receiver) {
    console.log({ target, property, receiver })
  },
})

// console.dir(json.SignIn, { depth: Infinity })
