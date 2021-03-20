const childProcess = require('child_process')
const { Command } = require('commander')

const program = new Command()

program
	.option('-p --publish [pkg]', 'Quickly publish a library')
	.option('-m --message [message]', 'Commit message')

program.parse(process.argv)

const args = program.opts()

;(async () => {
	const lib = {
		noodlTest: 'noodl-ui-test-utils',
	}

	const regex = {
		[lib.noodlTest]: /(ntest|noodl-ui-test-utils)/i,
	}

	const libName = regex[lib.noodlTest].test(args.publish)
		? lib.noodlTest
		: undefined

	if (!libName) {
		throw new Error(`Invalid lib name`)
	}

	const message = args.message || 'Update(s) to lib'
	const commands = [
		`lerna exec --scope ${libName} "npm version patch"`,
		`git add packages/${libName}`,
		`git commit -m "${message}"`,
		`lerna exec --scope ${libName} "npm run build && npm publish"`,
	]
	const commandString = commands.join(' && ')
	const shell = childProcess.spawn(commandString, {
		shell: true,
		stdio: 'inherit',
	})
	return
})()
