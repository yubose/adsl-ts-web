import * as u from '@jsmanifest/utils'
import execa from 'execa'
import meow from 'meow'

const regex = {
  'noodl-ui': /(nui|noodl-ui)/i,
  'noodl-ui-dom': /(ndom|noodl-ui-dom)/i,
  'noodl-types': /(nt|types|noodl-types)/i,
}

const cli = meow(``, {
  flags: {
    publish: { alias: 'p', type: 'string' },
    message: { alias: 'm', type: 'string' },
  },
  importMeta: import.meta,
})

const { message = 'Update(s) to lib', publish } = cli.flags

;(async () => {
  const lib = u.entries(regex).find(([_, regex]) => regex.test(publish))[0]

  if (!lib) throw new Error(`Invalid lib name`)

  execa.commandSync(
    [
      `lerna exec --scope ${lib} "npm version patch -f"`,
      `git add packages/${lib}`,
      `git commit -m "${message}"`,
      `lerna exec --scope ${lib} "npm run build && npm publish -f"`,
    ].join(' && '),
    { shell: true, stdio: 'inherit' },
  )
})()
