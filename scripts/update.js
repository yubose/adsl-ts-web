const { spawn, exec } = require('child_process')
const execa = require('execa')
const {
  cyan,
  coolGold,
  magenta,
  newline,
  red,
  deepOrange,
} = require('noodl-common')
const chalk = require('chalk')
const invariant = require('invariant')

/**
 *
 * @param { import('./op') } props
 */
async function update(props) {
  console.log('props', props)
  const path = require('path')
  const { readdir } = require('fs-extra')

  const { config, flags, input, tag } = props
  const { lib, deploy } = flags

  const localLibs = await readdir(
    path.resolve(path.join(process.cwd(), 'packages')),
  )

  const remotePkgs = []
  const localPkgs = []

  let npmInstallStr = `npm i`
  let addFilesStr = `git add `

  if (input[1] === 'sdk') {
    npmInstallStr = `${npmInstallStr}`
    remotePkgs.push('@aitmed/cadl@latest', '@aitmed/ecos-lvl2-sdk@latest')
  } else {
    addFilesStr = `lerna exec ${addFilesStr}`
    // Local packages
    const localPackages = input[1]?.slice().filter(Boolean)
    if (localPackages?.length) {
      for (const pkg of localPackages) {
        if (localLibs.includes(pkg)) {
          localPkgs.push(pkg)
        } else {
          // TODO - What should we do here?
        }
      }
    }
  }

  if (remotePkgs.length) {
    addFilesStr += `package.json package-lock.json`
  } else if (localPkgs.length) {
    for (const pkg of localPkgs) {
      if (localLibs.some((localLib) => localLib.endsWith(pkg))) {
        addFilesStr += ` packages/${pkg} `
      } else {
        newline()
        throw new Error(
          red(
            `The ${magenta(`local`)} package "${magenta(
              pkg,
            )} that was provided is not in the ${magenta(
              `/packages`,
            )} directory"\n`,
          ),
        )
      }
    }
  } else {
    newline()
    throw new Error(
      red(
        `There are no local/remote packages to update for input "${input}"\n`,
      ),
    )
  }

  newline()

  for (const pkg of [...remotePkgs, ...localPkgs]) {
    console.log(`${tag(`Updating`)} ${magenta(pkg)}`)
    npmInstallStr += ` ${pkg}`
  }

  newline()

  const numPackagesUpdating = remotePkgs.length + localPkgs.length

  const cmds = [
    npmInstallStr,
    addFilesStr,
    `git commit -m "Updated ${numPackagesUpdating} package(s)"`,
    `git push`,
    `npm run build:test`,
  ]

  if (deploy !== false) {
    console.log(
      `${tag('Temp')} Did not include the command to deploy to s3. ${deepOrange(
        `Disable when done testing`,
      )}`,
    )
    newline()
    // cmds.push('s3Deploy.sh build "devtest.aitmed.com"')
    // console.log(
    //   magenta(
    //     `\nDeploy script will run after the changes are pushed to GitLab\n`,
    //   ),
    // )
  }

  let shell = execa.commandSync(cmds.join(' && '), {
    shell: true,
    stdio: 'inherit',
  })

  console.log('Is this done yet?')

  return

  shell.stdout.on('data', (chunk) => {
    console.log(
      `${tag(`Chunk`)}`,
      Buffer.isBuffer(chunk) ? chunk.toString() : chunk,
    )
  })

  shell.stdout.on('end', () => {
    console.log(`\n${tag(`Building`)} the app \n`)

    return console.log(
      `${tag('Temp')} Returning early to avoid deploying to s3. ${deepOrange(
        `Disable when done testing`,
      )}`,
    )

    console.log(`\n${tag(`Deploying`)} to s3\n`)

    let nodejs = exec('npm run build:deploy:test', { shell: true })

    nodejs.stdout.on('data', (data) => {
      process.stdout.write(data.toString())
    })

    nodejs.stdout.on('end', () => {
      console.log(magenta(`\nDeployed\n`))
      process.exit(0)
    })
  })
}

module.exports = update
