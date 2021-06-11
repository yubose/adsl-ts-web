const execa = require('execa')

const commands = [`lerna exec --scope noodl-ui-test-utils "npm run build"`]

for (const command of commands) {
  execa.command(command, {
    shell: true,
    stdio: 'inherit',
  })
}
