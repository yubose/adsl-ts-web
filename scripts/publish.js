const childProcess = require('child_process')
const chalk = require('chalk')
const { Command } = require('commander')

const coolGold = (s) => chalk.keyword('navajowhite')(s)
const italic = (s) => chalk.white(chalk.italic(s))
const magenta = (s) => chalk.magenta(s)

const program = new Command()

program
  .option('-p --publish [pkg]', 'Publish a local package to the NPM registry')
  .option('-m --message [message]', 'Commit message')

program.parse(process.argv)

const args = program.opts()

;(async () => {
  const lib = {
    ndom: 'noodl-ui-dom',
    ntest: 'noodl-ui-test-utils',
    nui: 'noodl-ui',
    nutils: 'noodl-utils',
  }

  const regex = {
    [lib.ndom]: /(ndom|noodl-ui-dom)/i,
    [lib.ntest]: /(ntest|noodl-ui-test-utils)/i,
    [lib.nui]: /(nui|noodl-ui)/i,
    [lib.nutils]: /(nut|noodl-utils)/i,
  }

  function getPkgName(arg) {
    const entries = Object.entries(regex)
    for (let index = 0; index < entries.length; index++) {
      const [pkg, reg] = entries[index]
      if (reg.test(arg)) return lib[pkg]
    }
  }

  const pkgName = getPkgName()

  if (!pkgName) {
    throw new Error(
      `Could not locate a local package using the string "${magenta(
        args.publish,
      )}" to publish with`,
    )
  }

  const message = args.message || 'Update(s) to lib'

  const commands = [
    `lerna exec --scope ${pkgName} "npm version patch"`,
    `git add packages/${pkgName}`,
    `git commit -m "${message}"`,
    `lerna exec --scope ${pkgName} "npm run build && npm publish --access public"`,
  ].join(' && ')

  const shell = childProcess.spawn(commands, {
    shell: true,
    stdio: 'inherit',
  })
})()
