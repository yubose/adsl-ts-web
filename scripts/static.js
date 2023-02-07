const { execSync } = require('child_process')
const path = require('path')
const meow = require('meow')

const cli = meow('', {
  flags: {
    build: { type: 'boolean' },
    config: { type: 'string' },
    start: { type: 'boolean' },
    deploy: { type: 'boolean' },
    serve: { type: 'boolean' },
    version: { type: 'string' },
  },
})

const execOptions = {
  cwd: path.join(__dirname, '../apps/static'),
  shell: true,
  stdio: 'inherit',
}

let cmd = `npm `
let config = cli.flags.config || 'www'
let version = cli.flags.version // example: 4.06.20

if (cli.flags.deploy) {
  if (cli.flags.build) {
    cmd += 'run build'
    execSync(cmd, execOptions)
  }

  if (!version) {
    throw new Error(
      `Must pass in a version using ${u.yellow('--version')} when deploying`,
    )
  }

  cmd = `aws s3 sync ./public s3://d2bbkxkl9sogfu.cloudfront.net/static/${config}/${version}/`

  execSync(cmd, execOptions)
} else {
  if (cli.flags.build) {
    cmd += 'run build'
  } else if (cli.flags.serve) {
    cmd += 'run serve'
  } else {
    cmd += 'run start'
  }

  execSync(cmd, execOptions)
}
