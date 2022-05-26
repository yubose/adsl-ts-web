import { DiagnosticCode, ValidatorType } from '../constants'
// import type DiagnosticAssert from './DiagnosticAssert'
// import type { DiagnosticObject, DiagnosticAssertFn } from './diagnosticsTypes'
import { parsePageComponentUrl, toPageComponentUrl } from '../utils/noodl'
import * as is from '../utils/is'
// import type { AVisitor } from '../types'
// import * as t from './diagnosticsTypes'

// export function createDiagnosticCheckers(
//   diagnosticsTable: t.DiagnosticsMessageTable,
// ) {
//   const diagnosticsCheckers = new Map<number, (...args: any[]) => any>()

//   diagnosticsCheckers.set(1000, function check1000() {
//     //
//   })

//   return diagnosticsCheckers
// }

// function createKey(name: string, code: number): string {
//   return name.slice(0, 100) + '_' + code
// }

// export function buildMessagesOutput(
//   messageTable: t.DiagnosticsMessageTable,
// ): string {
//   let result = '{'
//   messageTable.forEach(({ code }, name) => {
//     const propName = convertPropertyName(name)
//     result += `\r\n  "${createKey(propName, code)}" : "${name.replace(
//       /["]/g,
//       '\\"',
//     )}",`
//   })
//   // Shave trailing comma, then add newline and ending brace
//   result = result.slice(0, result.length - 1) + '\r\n}'
//   // Assert that we generated valid JSON
//   JSON.parse(result)
//   return result
// }

// export function wrapVisitorCallback(visitFn: AVisitor['callback']) {
//   return (fn: AVisitor['callback']) => (...args: Parameters<AVisitor['callback']>) => {
//     return
//   }
// }

// export function composeRules<
//   D extends DiagnosticObject = DiagnosticObject,
//   R = D[],
//   H extends Record<string, any> = Record<string, any>,
//   Control = any,
// >(...rules: DiagnosticAssert[]) {
//   return function (args: Parameters<DiagnosticAssertFn<D, R, H, Control>>[0]) {
//     const control = rules[0].assert(args)
//     if (is.promise(control)) {
//       return control
//         .then((c) => {
//           if (is.und(c)) return composeAsyncRules(...rules.slice(1))
//         })
//         .catch((error) => {
//           throw error instanceof Error ? error : new Error(String(error))
//         })
//     }
//     for (const rule of rules.slice(1)) {
//       const control = rule.assert(args)
//       if (!is.und(control)) return control
//     }
//   }
// }

// export function composeAsyncRules<
//   D extends DiagnosticObject = DiagnosticObject,
//   R = D[],
//   H extends Record<string, any> = Record<string, any>,
//   Control = any,
// >(...rules: DiagnosticAssert[]) {
//   return async function (
//     args: Parameters<DiagnosticAssertFn<D, R, H, Control>>[0],
//   ) {
//     const control = await Promise.race(rules.map((rule) => rule.assert(args)))
//     if (!is.und(control)) return control
//   }
// }

// export function convertPropertyName(origName: string): string {
//   let result = origName
//     .split('')
//     .map((char) => {
//       if (char === '*') return '_Asterisk'
//       if (char === '/') return '_Slash'
//       if (char === ':') return '_Colon'
//       return /\w/.test(char) ? char : '_'
//     })
//     .join('')
//   // Get rid of all multi-underscores
//   result = result.replace(/_+/g, '_')
//   // Remove any leading underscore, unless it is followed by a number.
//   result = result.replace(/^_([^\d])/, '$1')
//   // Get rid of all trailing underscores.
//   result = result.replace(/_$/, '')
//   return result
// }

export function generateDiagnostic(code: DiagnosticCode, arg?: any) {
  const message = generateDiagnosticMessage(code, arg)
  if (message) return { code, message }
  return { code }
}

function generateDiagnosticMessage(code: DiagnosticCode, arg: any) {
  switch (code) {
    case DiagnosticCode.LOCAL_REF_MISSING_ROOT_KEY:
      return `Encountered a local reference "${arg.ref}" but a page name (rootKey) was not found`
    case DiagnosticCode.ROOT_REF_MISSING_ROOT_KEY:
      return (
        `Attemped to resolved a reference "${arg.ref}" but both rootKey and pageName was empty. ` +
        `No root level object could be retrieved`
      )
    case DiagnosticCode.ROOT_MISSING_ROOT_KEY:
      return `Attemped to resolved a reference "${arg.ref}" but the root object did not have "${arg.rootKey}" as a key`
    case DiagnosticCode.ROOT_VALUE_EMPTY:
      return `The value retrieved using the root key "${arg.rootKey}" was empty`
    case DiagnosticCode.TRAVERSAL_REF_INCOMPLETE_MISSING_KEY:
      return (
        `The reference "${arg.ref}" couldn't be resolved fully. ` +
        `Traversal stopped at "${arg.path.join('.')}" ` +
        `because the object at this iteration did not contain this key`
      )
    case DiagnosticCode.REFERENCE_UNRESOLVABLE:
      return `The reference ${arg.ref} is unresolvable`
    case DiagnosticCode.ROOT_REFERENCE_SECOND_LEVEL_KEY_UPPERCASE:
      return (
        `Root reference ${arg.ref} should not have its second level key ` +
        `"${arg.key}" begin with an uppercase`
      )
    case DiagnosticCode.GOTO_PAGE_MISSING_FROM_APP_CONFIG:
      return (
        `The page/destination "${arg.destination}" ` +
        `was not included in the app config (cadlEndpoint)`
      )
    case DiagnosticCode.GOTO_PAGE_COMPONENT_URL_CURRENT_PAGE_INVALID: {
      const { targetPage, viewTag } = parsePageComponentUrl(arg.destination)
      return `The page component url "${
        arg.destination
      }" does not contain the current page "${
        arg.page
      }". Expected "${toPageComponentUrl(arg.page, targetPage, viewTag)}"`
    }
    case DiagnosticCode.GOTO_PAGE_COMPONENT_URL_TARGET_PAGE_INVALID: {
      const { currentPage, viewTag } = parsePageComponentUrl(arg.destination)
      return `The page component url "${
        arg.destination
      }" does not correctly contain a target page. Expected "${toPageComponentUrl(
        currentPage,
        'TARGET_PAGE',
        viewTag,
      )}"`
    }
    case DiagnosticCode.GOTO_PAGE_COMPONENT_URL_VIEW_TAG_INVALID: {
      const { currentPage, targetPage } = parsePageComponentUrl(arg.destination)
      return `The page component url "${
        arg.destination
      }" does not correctly contain a viewTag. Expected "${toPageComponentUrl(
        currentPage,
        targetPage,
        'VIEW_TAG',
      )}"`
    }
    case DiagnosticCode.GOTO_PAGE_EMPTY:
      return `Goto destination is empty`
    case DiagnosticCode.GOTO_PAGE_MISSING_FROM_ROOT:
      return `Page "${arg.page}" is missing from root`
    case DiagnosticCode.VIEW_TAG_INVALID:
      return `Invalid viewTag "${arg.viewTag}"`
    case DiagnosticCode.VIEW_TAG_MISSING_COMPONENT_POINTER:
      return `The viewTag "${arg.viewTag}" does not have a pointer to any components`
    case DiagnosticCode.POPUP_VIEW_INVALID:
      return `Invalid popUpView "${arg.popUpView}"`
    case DiagnosticCode.POPUP_VIEW_MISSING_COMPONENT_POINTER:
      return `The popUpView "${arg.popUpView}" does not have a pointer to any components`
    default:
      throw new Error(`Invalid diagnostic code "${code}"`)
  }
}

// export function getDiagnosticCodeCoverage() {
//   const covered = [] as DiagnosticCode[]
//   const uncovered = [] as any[]

//   for (const code of Object.keys(DiagnosticCode)) {
//     if (generateDiagnosticMessage(DiagnosticCode[code], undefined)) {
//       covered.push(DiagnosticCode[code])
//     } else {
//       uncovered.push(code)
//     }
//   }

//   return {
//     covered,
//     uncovered,
//     coverage: `${covered.length / uncovered.length}%`,
//   }
// }

export function translateDiagnosticType(type: ValidatorType) {
  switch (type) {
    case 9000:
      return 'error'
    case 9001:
      return 'warn'
    case 9002:
      return 'info'
    default:
      return type
  }
}
