const execa = require('execa')
const u = require('@jsmanifest/utils')
const fs = require('fs-extra')
const path = require('path')
const cpy = require('cpy')

const log = console.log
const normalizePath = (s = '') => s.replace(/\\/g, '/')
const tag = (s) => `[${u.cyan(s)}]`

/**
 *
 * @param { import('./op') } props
 */
async function sync() {
  const shellArgs = { shell: true, stdio: 'inherit' }
  const command = async (cmd = '') => execa(cmd, shellArgs)

  async function syncRepos(repos) {
    /**
     * @param { string } url - Git repo url
     * @param { string } baseDir - Base directory
     * @param { string } appDir - Directory to the app files (.yml/assets)
     * @param { string | string[] } configFilePath - Filepath to the config file
     */
    async function syncRepo(repo) {
      const { url = '', from, to } = repo

      log(`${tag('syncing')} repo ${u.yellow(url)}`)

      try {
        let { baseDir, appFiles, configFrom } = from
        let { targetDir } = to
        let targetAssetsDir

        baseDir = normalizePath(path.resolve(baseDir))
        appFiles = normalizePath(path.join(baseDir, appFiles))
        configFrom = u
          .array(configFrom)
          .map((c) => normalizePath(path.join(baseDir, c)))
        targetDir = normalizePath(
          path.resolve(process.cwd(), targetDir).replace(/\\/g, '/'),
        )
        targetAssetsDir = path.join(targetDir, 'assets')

        if (fs.existsSync(baseDir)) {
          await command(`cd ${baseDir}`)
          await command(`git pull -f`)
        } else {
          await command(`git clone ${url} ${baseDir}`)
          log(`${tag('git cloned')} to ${u.yellow(baseDir)}`)
        }

        if (!fs.existsSync(targetDir)) {
          await fs.ensureDir(targetDir)
          log(`${tag('created output directory')} ${u.yellow(targetDir)}`)
        }

        await Promise.all(
          u.array(configFrom).map(async (filepath) => {
            try {
              const yml = await fs.readFile(filepath, 'utf8')
              const configName = path.basename(filepath)
              await fs.writeFile(path.join(targetDir, configName), yml, 'utf8')
              return yml
            } catch (error) {
              log(`${tag('Error')}: ${error.message}`)
            }
          }),
        )

        await cpy(path.join(appFiles, '*'), targetDir)
        await cpy(path.join(appFiles, 'assets/**/*'), targetAssetsDir)
      } catch (error) {
        console.error(error)
      }
    }

    try {
      await Promise.all(repos.map(async (repo) => syncRepo(repo)))
    } catch (error) {
      console.error(error)
    }
  }

  await syncRepos([
    {
      url: 'http://gitlab.aitmed.com/production/superAdmin.git',
      from: {
        baseDir: '../superadmin',
        appFiles: 'superadmin',
        configFrom: 'config/sadmind.yml',
      },
      to: {
        targetDir: 'generated/sadmind',
      },
    },
    {
      url: 'http://gitlab.aitmed.com/production/admin.git',
      from: {
        baseDir: '../admind2',
        appFiles: 'admin',
        configFrom: [
          'config/admin.yml',
          'config/admind.yml',
          'config/admind2.yml',
        ],
      },
      to: {
        targetDir: 'generated/admind2',
      },
    },
    {
      url: 'http://gitlab.aitmed.com/production/search.git',
      from: {
        baseDir: '../searchd2',
        appFiles: 'search',
        configFrom: [
          'config/search.yml',
          'config/searchd.yml',
          'config/searchd2.yml',
        ],
      },
      to: {
        targetDir: 'generated/searchd2',
      },
    },
    {
      url: 'http://gitlab.aitmed.com/production/aitmed.git',
      from: {
        baseDir: '../aitmed',
        appFiles: 'patient',
        configFrom: [
          'config/patient.yml',
          'config/patd.yml',
          'config/patd2.yml',
        ],
      },
      to: {
        targetDir: 'generated/patd2',
      },
    },
    {
      url: 'http://gitlab.aitmed.com/production/aitmed.git',
      from: {
        baseDir: '../aitmed',
        appFiles: 'provider',
        configFrom: [
          'config/provider.yml',
          'config/prod.yml',
          'config/prod2.yml',
        ],
      },
      to: {
        targetDir: 'generated/prod2',
      },
    },
    {
      url: 'http://gitlab.aitmed.com/production/cadl.git',
      from: {
        baseDir: '../cadl',
        appFiles: 'meet3',
        configFrom: [
          'config/meet.yml',
          'config/meetd.yml',
          'config/meetd2.yml',
        ],
      },
      to: {
        targetDir: 'generated/meetd2',
      },
    },
    {
      url: 'http://gitlab.aitmed.com/production/cadl.git',
      from: {
        baseDir: '../cadl',
        appFiles: 'testpage',
        configFrom: 'config/testpage.yml',
      },
      to: {
        targetDir: 'generated/meetd2',
      },
    },
  ])
}

module.exports = sync
