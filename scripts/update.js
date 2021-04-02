const childProcess = require('child_process')
const chalk = require('chalk')
const { Command } = require('commander')

const coolGold = (s) => chalk.keyword('navajowhite')(s)
const italic = (s) => chalk.white(chalk.italic(s))
const magenta = (s) => chalk.magenta(s)

const program = new Command('Update')

program.option('-u --preset [value]', 'Update')
program.parse(process.argv)

const args = program.opts()

console.log(args)
;(async () => {
  const cmds = []

  const pkgMap = {
    sdk: '@aitmed/cadl',
    lvl2sdk: '@aitmed/ecos-lvl2-sdk',
  }

  switch (args.preset) {
    case 'sdk': {
      cmds.push(
        ...[
          `npm i ${pkgMap.sdk}@latest ${pkgMap.lvl2sdk}@latest`,
          `git add package.json package-lock.json`,
          `git commit -m "Updated NOODL SDK package(s)"`,
          `git push`,
        ],
      )
      break
    }
    default:
      break
  }

  const shell = childProcess.spawn(cmds.join(' && '), {
    shell: true,
    stdio: 'inherit',
  })
})()
