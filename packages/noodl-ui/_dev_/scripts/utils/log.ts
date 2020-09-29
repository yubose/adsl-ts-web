import chalk from 'chalk'

const block =
  '\n----------------------------------------------------------------------------------\n'

export const log = console.log
export const blue = (s: string) => log(chalk.blueBright(s))
export const cyan = (s: string) => log(chalk.cyanBright(s))
export const green = (s: string) => log(chalk.greenBright(s))
export const magenta = (s: string) => log(chalk.magentaBright(s))
export const red = (s: string) => log(chalk.redBright(s))
export const yellow = (s: string) => log(chalk.yellowBright(s))
export const white = (s: string) => log(chalk.whiteBright(s))
export const divider = () => log(block)
export const blank = () => log('')
export const attention = (s: string) => console.log(block + `   ${s}` + block)
