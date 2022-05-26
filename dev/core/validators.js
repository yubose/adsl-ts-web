const y = require('yaml')
const nt = require('noodl-types')
const n = require('noodl-core')
const ny = require('noodl-yaml')
const u = require('@jsmanifest/utils')
const nu = require('noodl-utils')

const builtIns = n.getBuiltIns()

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
 * @property { InstanceType<import('noodl-core')['ARoot']> } [VisitFnArgs.root]
 * @property { Record<string, any> } [VisitFnArgs.data]
 */

/**
 * @param {{ validate: (args: VisitFnArgs) => { type?: import('noodl-core').consts.ValidatorType; message: string | string[] } }} config
 */
function createValidator(config) {
  return config
}

/**
 * @param { nt.ReferenceString } ref
 * @returns {{ paths: string[]; path: string }}
 */
const stripRef = (ref) => {
  const trimmed = trimReference(ref)
  return { paths: toPath(trimmed), path: trimmed }
}

/**
 * @param { nt.ReferenceString | y.Scalar<nt.ReferenceString> } node
 * @param {{ depth: number; root: n.ARoot, rootKey: string }} args
 */
function validateReference(node, { root, rootKey }) {
  let prevRootKey = rootKey
  let ref = ny.unwrap(node)
  let isLocal = nt.Identify.localReference(ref)
  let { paths, path } = stripRef(ref)

  if (isLocal) {
    if (!rootKey) {
      throw new Error(
        n.generateDiagnosticMessage(
          n.consts.DiagnosticCode.LOCAL_REF_MISSING_ROOT_KEY,
          { ref },
        ),
      )
    }
  } else {
    rootKey = paths.shift()
  }

  if (!rootKey) {
    throw new Error(`rootKey is required. Previous rootKey: ${prevRootKey}`)
  }

  if (!(rootKey in root.value)) {
    throw new Error(
      n.generateDiagnosticMessage(
        n.consts.DiagnosticCode.ROOT_MISSING_ROOT_KEY,
        { ref, rootKey },
      ),
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
      if (!mapNode.hasIn(paths)) {
        results.push({
          type: n.consts.ValidatorType.ERROR,
          key,
          value: ref,
          message: n.generateDiagnosticMessage(
            n.consts.DiagnosticCode.TRAVERSAL_REF_INCOMPLETE_MISSING_KEY,
            { ref, path },
          ),
          depth,
        })
      } else {
        const refValue = mapNode.getIn(paths)

        if (!refValue) {
          results.push({
            type: n.consts.ValidatorType.ERROR,
            key,
            value: ref,
            message: `The reference "${ref}" couldn't be resolved`,
            depth,
          })
        } else {
          if (y.isScalar(refValue) && nt.Identify.reference(refValue)) {
            //
          } else {
            console.log({
              resolvedReferenceValue: refValue,
              reference: ref,
            })
          }
        }
      }
    } else {
      console.error(new Error(`CONTINUE THIS IMPLEMENTATION`))
    }
  } else {
    results.push({
      type: n.consts.ValidatorType.ERROR,
      key,
      value: dataObject,
      message: n.generateDiagnosticMessage(
        n.consts.DiagnosticCode.ROOT_VALUE_EMPTY,
        { rootKey },
      ),
      depth,
    })
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

      if (!args.root?.value) {
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
            const { pageName, ...rest } = args
            validateReference(node, { depth, rootKey: pageName, ...rest })
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
