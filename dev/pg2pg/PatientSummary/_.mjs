import * as u from '@jsmanifest/utils'
import fs from 'fs-extra'
import path from 'path'

const PatientSummary = fs.readJsonSync(
  path.join(process.cwd(), 'dev/pg2pg/PatientSummary/parsed.json'),
)

/**
 * @param { (...args: any[]) => any } cb
 * @param { string[] } path
 * @param { Record<string, any> } value
 */

function visit(cb, value, path = []) {
  if (!value || (!u.isArr(value) && !u.isObj(value))) {
    return cb(value, path)
  }

  if (u.isArr(value)) {
    return u.forEach((v, i) => visit(cb, v, path.concat(i), cb), value)
  }

  if (u.isObj(value)) {
    for (const [key, val] of u.entries(value)) {
      const nextPath = path.concat(key)

      cb(val, nextPath)

      if (key === 'style') {
        if (u.isObj(val)) {
          const { marginTop, top, left, width, height } = val
        }
      }

      if (u.isArr(val) || u.isObj(val)) {
        visit(cb, val, nextPath)
      }
    }
  }
}

const results = []

visit((value, path) => {
  if (results.length <= 25) {
    results.push({ value, path })
  }
}, PatientSummary)

process.stdout.write('\x1Bc')
console.log(results)
