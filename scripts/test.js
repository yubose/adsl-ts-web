const execa = require('execa')
const u = require('@jsmanifest/utils')

/**
 * @param { import('./op') } props
 */
async function test(props) {
  const { test: key, file } = props.flags

  const tests = {
    ntil: `npm run test:ntil`,
    nui: `npm run test:nui`,
    ndom: `npm run test:ndom`,
  }

  if (tests[key]) {
    let cmdStr = tests[key]
    file && (cmdStr += `:file`)
    execa(tests[key], { shell: true, stdio: 'inherit' })
  } else {
    throw new Error(
      `Did not find a test preset for key "${key}". Available presets: ${u
        .keys(tests)
        .join(', ')}`,
    )
  }
}

module.exports = test
