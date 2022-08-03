const { spawnSync } = require('child_process')
const fs = require('fs-extra')
const meow = require('meow')

const cli = meow('')

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

const environmentVariables = getEnvironmentVariables()

fs.writeFileSync(
  `${__dirname}/.env`,
  Object.entries(environmentVariables).reduce((str, [key, value]) => {
    if (value && typeof value === 'object') {
      value = JSON.stringify(value)
    }
    str += `${key}=${value}\n`
    return str
  }, ''),
  'utf8',
)

spawnSync(`npm run build`, {
  shell: true,
  stdio: 'inherit',
})
