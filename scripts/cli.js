const childProcess = require('child_process')
const { Command } = require('commander')

const program = new Command('aitmed-noodl-web cli scripts')

program.command('build <env> [serve]').action((env, serve) => {
  let shell

  if (env === 'test') {
    shell = childProcess.exec('npm run build:test', { shell: true })

    shell.on('data', (data) => {
      console.log(data)
    })

    shell.stdout.pipe(process.stdin)
  } else {
    //
  }
})

const args = program.parse(process.env.argv)

console.log(`Args`, args)
