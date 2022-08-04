const fs = require('fs-extra')
const path = require('path')
const readline = require('readline')
const u = require('@jsmanifest/utils')
const { spawnSync } = require('child_process')
const winston = require('winston')

const log = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.cli(),
    winston.format.colorize({
      colors: {
        debug: 'gray',
      },
    }),
  ),
  transports: [new winston.transports.Console()],
})

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  tabSize: 2,
})

/**
 * @param { string } question
 * @returns { Promise<string> }
 */
const ask = (question) =>
  new Promise((resolve) => rl.question(question, resolve))

/**
 * @param { string } cmd
 * @returns { import('child_process').SpawnSyncReturns }
 */
const exec = (cmd, o) => spawnSync(cmd, { shell: true, stdio: 'inherit', ...o })
const getPath = (...s) => path.join(process.cwd(), ...s)

;(async function () {
  try {
    u.newline()

    log.info(`Running post install script`)

    const packagesDir = getPath('packages')

    if (fs.existsSync(packagesDir)) {
      const newRepo =
        'https://gitlab.aitmed.com/pfftdammitchris/aitmed-noodl-lib'

      log.info(
        `The "packages" directory at ${u.yellow('./packages')} ` +
          `is deprecated`,
      )

      log.info(
        `Please move all changes/updates to internal packages (noodl-ui, noodl-types, etc) to the new repository at ${newRepo} and confirm here that you are ready to proceed`,
      )

      log.info(
        u.bold(
          `The ./packages directory will be removed after this prompt when entering "y" or "yes"`,
        ),
      )

      const answer = await ask(
        `Have you migrated all your changes/updates (if any) to the ` +
          `${u.cyan('aitmed-noodl-lib')} repository? ` +
          `(${u.green('y')}/${u.red('n')})\n`,
      )

      if (/y/i.test(answer)) {
        try {
          const folders = await fs.readdir(packagesDir, 'utf8')

          for (const folder of folders) {
            const filepath = path.join(packagesDir, folder)
            log.info(`Removing ${u.yellow(filepath)}`)
            await fs.remove(filepath)
          }

          await fs.remove(packagesDir)
          log.info(`${u.yellow(packagesDir)} was removed`)

          u.newline()
          log.info(u.divider)

          log.info(`The new repository structure for this project explained:`)

          log.info(
            `    ${u.cyan(
              './apps/static',
            )} is for static web app (previously ${u.yellow(
              './packages/homepage',
            )})`,
          )

          log.info(
            `    ${u.cyan(
              './apps/web',
            )} is for [dynamic] web app (previously ${u.yellow('./src')})`,
          )

          log.info(u.divider)
          u.newline()

          log.info(
            `All updates to internal noodl packages should be made in the ${u.cyan(
              'aitmed-noodl-lib',
            )} repository`,
          )

          log.info(
            `${u.white(
              'Clone',
            )} the repository from https://gitlab.aitmed.com/pfftdammitchris/aitmed-noodl-lib`,
          )

          log.info(
            `To publish an updated library in that repo just run ${u.yellow(
              `npm run publish`,
            )} and enter "${u.yellow('Y')}" or "${u.yellow('yes')}" ${u.italic(
              u.bold(u.white('even if it prompts to update multiple packages')),
            )} at once`,
          )

          log.info(
            `After publishing you should be able to run ${u.yellow(
              'npm install noodl-ui@latest',
            )} from ${u.yellow(
              './apps/web',
            )} (or name of the package you specifically updated)`,
          )

          if (fs.existsSync(getPath('build'))) {
            try {
              // Remove remnants for a fresh feel
              await fs.remove(getPath('build'))
            } catch (error) {}
          }
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error))
          log.error(
            `An error occurred attempting to remove ${u.yellow('./packages')}`,
          )
          log.error(`[${u.yellow(err.name)}] ${u.red(err.message)}`)
          process.exit(0)
        }
      } else {
        process.exit(0)
      }
    }

    u.newline()

    log.info(u.green('Post install script finished'))

    process.exit(0)
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.log(`[${u.yellow(err.name)}] ${u.red(err.message)}`)
  }
})()
