const { execSync } = require('child_process')

let cmd = ''

cmd += `npm i -D @aitmed/cadl@latest @aitmed/ecos-lvl2-sdk@latest -f`
cmd += ` && `
cmd += `lerna exec --scope web "npm i @aitmed/cadl@latest @aitmed/ecos-lvl2-sdk@latest -f"`

execSync(cmd, { shell: true, stdio: 'inherit' })
