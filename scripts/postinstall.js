const u = require('@jsmanifest/utils')
const execa = require('execa')

/**
 * @param { string[] } libs
 */
function install(libs) {
  return new Promise(async (resolve, reject) => {
    let cmd = `lerna exec `

    libs.forEach((lib) => (cmd += `--scope ${lib} `))

    cmd += `\"npm run build\"`

    const shell = execa(cmd, {
      shell: true,
      stdio: 'inherit',
    })

    let data = ''

    shell.on('data', (chunk) => {
      const chunkOfData = Buffer.from(chunk).toString()
      data += chunkOfData
      console.log(u.white(chunkOfData))
    })

    shell.on('error', (err) => {
      console.error(`[${u.yellow(err.name)}] ${u.red(err.message)}`, err)
      reject(err)
    })

    shell.on('end', () => {
      console.log(`[${u.green('Ended')}] ${new Date().toLocaleString()}`)
      resolve()
    })

    shell.on('readable', () => {
      console.log(`[${u.cyan('Readable')}] ${new Date().toLocaleString()}`)
    })

    shell.on('pause', () => {
      console.log(`[${u.blue('Paused')}] ${new Date().toLocaleString()}`)
    })

    shell.on('resume', () => {
      console.log(`[${u.magenta('Resumed')}] ${new Date().toLocaleString()}`)
    })

    shell.on('close', (code, signal) => {
      console.log(`[${u.cyan('Closed')}] ${new Date().toLocaleString()}`, {
        code,
        signal,
      })
    })
  })
}

;(async function () {
  try {
    u.newline()

    for (const libs of [
      ['noodl-types'],
      ['noodl-action-chain', 'noodl-utils'],
    ]) {
      console.log(`${u.cyan('Installing')}: ${u.magenta(libs.join(', '))}`)
      await install(libs)
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.log(`[${u.yellow(err.name)}] ${u.red(err.message)}`)
  }
})()
