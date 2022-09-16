const { execSync } = require('child_process')
const meow = require('meow')

const cli = meow('', {
  flags: {
    config: { alias: 'c', type: 'string', default: 'www' },
    version: { alias: 'v', type: 'string' },
  },
})

const configKey = cli.flags.config
const configVersion = cli.flags.version // 4.06.x

function getDeployString() {
  let bucket = 'public.aitmed.com'
  let cmd = `aws s3 sync public/ s3://${bucket}/static/${configKey}/${configVersion}/`

  if (!configVersion) {
    throw new Error(
      `Version must be provided (ex: node deploy --version 4.06.18)`,
    )
  }

  return cmd
}

function getEnvironmentVariables() {
  const currentVersion = cli.pkg.version
  const env = {}

  if (currentVersion) {
    let [major, minor, patch] = currentVersion.split('.')

    patch = Number(patch) + 1

    env.GATSBY_BUILD = {
      packages: {
        gatsby: cli.pkg.dependencies.gatsby,
        'noodl-types': cli.pkg.dependencies['noodl-types'],
        'noodl-ui': cli.pkg.dependencies['noodl-ui'],
        'noodl-utils': cli.pkg.dependencies['noodl-utils'],
      },
      timestamp: new Date().toLocaleString(),
      version: `${major}.${minor}.${patch}`,
    }
  }

  return env
}

execSync(getDeployString(), { shell: true, stdio: 'inherit' })
console.log(getEnvironmentVariables())
