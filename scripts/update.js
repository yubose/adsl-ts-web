const { spawn, exec, execFile } = require('child_process')
const chalk = require('chalk')
const { Command } = require('commander')

const coolGold = (s) => chalk.keyword('navajowhite')(s)
const italic = (s) => chalk.white(chalk.italic(s))
const magenta = (s) => chalk.magenta(s)

const program = new Command('Update')

program.option('-u --preset [value]', 'Update')
program.option('-d --deploy', 'Deploy')
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
        `npm i ${pkgMap.sdk}@latest ${pkgMap.lvl2sdk}@latest`,
        `git add package.json package-lock.json`,
        `git commit -m "Updated NOODL SDK package(s)"`,
        `git push`,
      )
      if (args.deploy) {
        cmds.push('s3Deploy.sh build "devtest.aitmed.com"')
        console.log(
          chalk.magenta(
            `\nDeploy script will run after the changes are pushed to GitLab\n`,
          ),
        )
      }
      break
    }
    default:
      break
  }

  let shell = spawn(cmds.join(' && '), { shell: true })

  shell.stdout.on('data', (data) => {
    console.log(data.toString())
  })

  shell.stdout.on('end', () => {
    console.log(`\n${magenta(`Deploying...`)}\n`)

    let nodejs = exec('npm run build:deploy:test', { shell: true })

    nodejs.stdout.on('data', (data) => {
      console.log(data.toString())
    })

    // nodejs.stdout.pipe(process.stdout)
    process.stdout.pipe(nodejs.stdout)

    nodejs.stdout.on('end', () => {
      console.log(magenta(`\nDeployed`))
      nodejs.disconnect()
    })
  })
})()
