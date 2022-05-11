const y = require('yaml')
const nt = require('noodl-types')
const n = require('@noodl/core')
const u = require('@jsmanifest/utils')
const nu = require('noodl-utils')

const unwrap = (node) => (y.isScalar(node) ? node.value : node)
const has = (node, key) => node.has(key)
const hasAny = (node, key) => node.has(key)
const hasEqualTo = (node, key, v) =>
  node.has(key) && node.get(key) === unwrap(v)
const builtIns = n.getBuiltIns()

const is = {
  array: ({ node }) => y.isSeq(node),
  object: ({ node }) => y.isMap(node) || y.isDocument(node),
  string: ({ node }) => y.isScalar(node) && u.isStr(node.value),
  number: ({ node }) => y.isScalar(node) && u.isNum(node.value),
  nil: ({ node }) => y.isScalar(node) && u.isNil(node.value),
  undefined: ({ node }) => y.isScalar(node) && u.isUnd(node.value),
  builtInFn: ({ node }) => {
    if (
      y.isMap(node) &&
      node.items.length === 1 &&
      y.isScalar(node.items[0].key)
    ) {
      const key = node.items[0].key.value
      return u.isStr(key) && key.startsWith(`=.builtIn`)
    }
    return false
  },
  button: ({ node }) => is.object(node) && hasEqualTo(node, 'type', 'button'),
  canvas: ({ node }) => is.object(node) && hasEqualTo(node, 'type', 'canvas'),
  chart: ({ node }) => is.object(node) && hasEqualTo(node, 'type', 'chart'),
  chatList: ({ node }) =>
    is.object(node) && hasEqualTo(node, 'type', 'chatList'),
  ecosDoc: ({ node }) => is.object(node) && hasEqualTo(node, 'type', 'ecosDoc'),
  divider: ({ node }) => is.object(node) && hasEqualTo(node, 'type', 'divider'),
  footer: ({ node }) => is.object(node) && hasEqualTo(node, 'type', 'footer'),
  header: ({ node }) => is.object(node) && hasEqualTo(node, 'type', 'header'),
  image: ({ node }) => is.object(node) && hasEqualTo(node, 'type', 'image'),
  label: ({ node }) => is.object(node) && hasEqualTo(node, 'type', 'label'),
  list: ({ node }) => is.object(node) && hasEqualTo(node, 'type', 'list'),
  listItem: ({ node }) =>
    is.object(node) && hasEqualTo(node, 'type', 'listItem'),
  map: ({ node }) => is.object(node) && hasEqualTo(node, 'type', 'map'),
  page: ({ node }) => is.object(node) && hasEqualTo(node, 'type', 'page'),
  plugin: ({ node }) => is.object(node) && hasEqualTo(node, 'type', 'plugin'),
  pluginHead: ({ node }) =>
    is.object(node) && hasEqualTo(node, 'type', 'pluginHeade'),
  pluginBodyTail: ({ node }) =>
    is.object(node) && hasEqualTo(node, 'type', 'pluginBodyTail'),
  popUp: ({ node }) => is.object(node) && hasEqualTo(node, 'type', 'popUp'),
  register: ({ node }) =>
    is.object(node) && hasEqualTo(node, 'type', 'register'),
  select: ({ node }) => is.object(node) && hasEqualTo(node, 'type', 'select'),
  scrollView: ({ node }) =>
    is.object(node) && hasEqualTo(node, 'type', 'scrollViewe'),
  textField: ({ node }) =>
    is.object(node) && hasEqualTo(node, 'type', 'textField'),
  textView: ({ node }) =>
    is.object(node) && hasEqualTo(node, 'type', 'textView'),
  video: ({ node }) => is.object(node) && hasEqualTo(node, 'type', 'video'),
  view: ({ node }) => is.object(node) && hasEqualTo(node, 'type', 'view'),
}

/**
 * @typedef YAMLNode
 * @type { y.Node | y.Document | y.Document.Parsed | y.Pair }
 */

/**
 * @typedef VisitFnArgs
 * @property { null | 'key' | 'value' } [VisitFnArgs.key]
 * @property { YAMLNode } [VisitFnArgs.node]
 * @property { string } [VisitFnArgs.pageName]
 * @property { YAMLNode[] } [VisitFnArgs.path]
 * @property { InstanceType<import('@noodl/core')['ARoot']> } [VisitFnArgs.root]
 * @property { Record<string, any> } [VisitFnArgs.data]
 */

/**
 * @param {{ validate: (args: VisitFnArgs) => { type?: import('@noodl/core').consts.ValidatorType; message: string | string[] } }} config
 */
function createValidator(config) {
  return config
}

/**
 * @param { nt.ReferenceString | y.Scalar<nt.ReferenceString> } node
 * @param { import('@noodl/core').VisitFnArgs & { depth: number } } args
 */
function validateReference(node, { pageName, root }) {
  const reference = u.isStr(node) ? node : node.value
  const datapathStr = nu.trimReference(reference)
  const datapath = nu.toDataPath(datapathStr)

  let isLocal = nt.Identify.localReference(reference)
  let rootKey = ''

  if (!root || !root.value) {
    throw new Error(
      `Could not resolve the reference "${reference}" because the root object was null or undefined`,
    )
  }

  if (isLocal) {
    if (!pageName) {
      throw new Error(
        `Encountered a local reference "${reference}" but a page name (rootKey) was not provided`,
      )
    }
    rootKey = pageName
  } else {
    rootKey = datapath.shift()
  }

  if (!rootKey && !pageName) {
    throw new Error(
      `Attemped to resolved a reference "${reference}" but both rootKey and pageName was empty. No root level object could be retrieved`,
    )
  }

  if (!(rootKey in root.value)) {
    throw new Error(
      `Attemped to resolved a reference "${reference}" but the root object did not have "${rootKey}" as a key`,
    )
  }

  const dataObject = root.get(rootKey)

  if (dataObject) {
    let mapNode

    if (y.isMap(dataObject)) {
      mapNode = dataObject
    } else if (y.isDocument(dataObject)) {
      mapNode = dataObject.contents
    }

    if (y.isMap(mapNode)) {
      if (!mapNode.hasIn(datapath)) {
        results.push({
          type: n.consts.ValidatorType.ERROR,
          key,
          value: reference,
          message:
            `The reference "${reference}" couldn't be resolved fully. ` +
            `Traversal stopped at "${datapath.join('.')}" ` +
            `because the object at this iteration did not contain this key`,
          depth,
        })
      } else {
        const refValue = mapNode.getIn(datapath)

        if (!refValue) {
          results.push({
            type: n.consts.ValidatorType.ERROR,
            key,
            value: reference,
            message: `The reference "${reference}" couldn't be resolved`,
            depth,
          })
        } else {
          if (y.isScalar(refValue) && nt.Identify.reference(refValue)) {
            //
          } else {
            console.log({
              resolvedReferenceValue: refValue,
              reference,
            })
          }
        }
      }
    } else {
      console.error(new Error(`CONTINUE THIS IMPLEMENTATION`))
    }
  } else {
    throw new Error(
      `The value retrieved using the rootKey/pageName "${rootKey}" was empty`,
    )
  }
}

const validators = [
  createValidator({
    validate: (args) => {
      const { node, path: nodePath } = args
      const depth = nodePath?.length || 0
      const results = []

      if (!('root' in args)) {
        throw new Error(`Root is not passed in as arguments to the validators`)
      }

      if (!args.root) {
        throw new Error(
          `Root object passed in as arguments to validators is null or undefined`,
        )
      }

      if (!('pageName' in args)) {
        throw new Error(
          `Page name is not passed in as arguments to the validators`,
        )
      }

      if (y.isScalar(node)) {
        if (u.isStr(node.value)) {
          if (nt.Identify.reference(node.value)) {
            validateReference(node, { depth, ...args })
          }
        }
      } else {
        //
      }

      if (results.length) return results
    },
  }),
]

module.exports = validators
