const { execSync } = require('child_process')
const path = require('path')
const meow = require('meow')

const cli = meow('', {
  flags: {
    start: { type: 'boolean' },
    build: { type: 'boolean' },
    deploy: { type: 'boolean' },
    stable: { type: 'boolean' },
    serve: { type: 'boolean' },
    test: { type: 'boolean' },
    app: { type: 'string' },
  },
})

const env = {
  ...process.env,
}

const execOptions = {
  env,
  cwd: path.join(__dirname, '../apps/web'),
  shell: true,
  stdio: 'inherit',
}

let cmd = ''

if (cli.flags.deploy) {
  let isStable = true

  if (cli.flags.build) {
    cmd += `cross-env `
    env.NODE_ENV = 'production'

    if (cli.flags.test) {
      env.ECOS_ENV = 'test'
      cmd += 'ECOS_ENV=test '
      isStable = false
    } else {
      execSync(`cd apps/web/ && npm version patch -f && cd ../..`)
      env.ECOS_ENV = 'stable'
    }

    cmd += 'npm run build '
    cmd += '-- '
    cmd += '--env ECOS_ENV=true '
    cmd += '--env DEPLOYING=true '
    cmd += '--env NODE_ENV=production '

    execSync(cmd, execOptions)
  }

  execSync(`npm run deploy:${isStable ? 'stable' : 'test'}`)
} else {
  cmd += `cross-env `

  if (cli.flags.build) {
    cmd += 'NODE_ENV=production '

    if (cli.flags.test) {
      env.ECOS_ENV = 'test'
      cmd += 'ECOS_ENV=test '
    } else {
      env.ECOS_ENV = 'stable'
      cmd += 'ECOS_ENV=stable '
    }

    cmd += 'npx webpack --mode=production'
  } else if (cli.flags.start) {

    if (cli.flags.stable) {
      cmd += 'NODE_ENV=production '
      cmd += 'USE_DEV_PATHS=true '
      env.ECOS_ENV = 'stable'
      cmd += 'ECOS_ENV=stable '
    } else {
      cmd += 'NODE_ENV=development '
      cmd += 'USE_DEV_PATHS=true '
      env.ECOS_ENV = 'test'
      cmd += 'ECOS_ENV=test '
    }

    cmd += 'npm run start '

    if (cli.flags.app) {
      cmd += `-- --env DEBUG=${cli.flags.app} `
    }
  } else if (cli.flags.serve) {
    cmd = 'npm run serve'
  } else {
    throw new Error(
      `Must use --start or --build or --serve if --deploy is not used`,
    )
  }
  console.log('> '+cmd)
  execSync(cmd, execOptions)
}
