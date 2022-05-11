import { ValidatorType } from '../constants'
import * as t from './diagnosticsTypes'

export function createDiagnosticCheckers(
  diagnosticsTable: t.DiagnosticsMessageTable,
) {
  const diagnosticsCheckers = new Map<number, (...args: any[]) => any>()

  diagnosticsCheckers.set(1000, function check1000() {
    //
  })

  return diagnosticsCheckers
}

function createKey(name: string, code: number): string {
  return name.slice(0, 100) + '_' + code
}

export function buildMessagesOutput(
  messageTable: t.DiagnosticsMessageTable,
): string {
  let result = '{'
  messageTable.forEach(({ code }, name) => {
    const propName = convertPropertyName(name)
    result += `\r\n  "${createKey(propName, code)}" : "${name.replace(
      /[\"]/g,
      '\\"',
    )}",`
  })
  // Shave trailing comma, then add newline and ending brace
  result = result.slice(0, result.length - 1) + '\r\n}'
  // Assert that we generated valid JSON
  JSON.parse(result)
  return result
}

export function convertPropertyName(origName: string): string {
  let result = origName
    .split('')
    .map((char) => {
      if (char === '*') return '_Asterisk'
      if (char === '/') return '_Slash'
      if (char === ':') return '_Colon'
      return /\w/.test(char) ? char : '_'
    })
    .join('')
  // Get rid of all multi-underscores
  result = result.replace(/_+/g, '_')
  // Remove any leading underscore, unless it is followed by a number.
  result = result.replace(/^_([^\d])/, '$1')
  // Get rid of all trailing underscores.
  result = result.replace(/_$/, '')
  return result
}

export const diagnosticFunctions = {
  '1000': (name: string) => {
    return {
      //
    }
  },
}

export function translateDiagnosticType(type: ValidatorType) {
  switch (type) {
    case 9000:
      return 'ERROR'
    case 9001:
      return 'WARN'
    case 9002:
      return 'INFO'
    default:
      return type
  }
}
