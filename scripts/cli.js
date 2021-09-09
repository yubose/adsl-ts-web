const { Command } = require('commander')

const program = new Command('aitmed-noodl-web cli scripts')

program.command('build <env> [serve]').action((env, serve) => {
  let shell
  let args = 'npm run build'

  if (env === 'test') {
    args

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
