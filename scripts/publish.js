const childProcess = require('child_process')
const { Command } = require('commander')

const program = new Command()

program
  .option('-p --publish [pkg]', 'Quickly publish a library')
  .option('-m --message [message]', 'Commit message')

program.parse(process.argv)

const args = program.opts()

;(async () => {
  const lib = {
    noodlDom: 'noodl-ui-dom',
    noodlTest: 'noodl-ui-test-utils',
    noodlUi: 'noodl-ui',
    noodlUtils: 'noodl-utils',
  }

  const regex = {
    [lib.noodlDom]: /(ndom|noodl-ui-dom)/i,
    [lib.noodlTest]: /(ntest|noodl-ui-test-utils)/i,
    [lib.noodlUi]: /(nui|noodl-ui)/i,
    [lib.noodlUtils]: /(nutils|noodl-utils)/i,
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
    throw new Error(`Could not locate a local library to publish with`)
  }

  const message = args.message || 'Update(s) to lib'
  const commands = [
    `lerna exec --scope ${pkgName} "npm version patch"`,
    `git add packages/${pkgName}`,
    `git commit -m "${message}"`,
    `lerna exec --scope ${pkgName} "npm run build && npm publish"`,
  ]
  const commandString = commands.join(' && ')
  const shell = childProcess.spawn(commandString, {
    shell: true,
    stdio: 'inherit',
  })
  return
})()
