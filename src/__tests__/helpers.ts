import chalk from 'chalk'

export const highlight = (...args: any[]) => chalk.yellow(...args)
export const italic = (...args: any[]) => chalk.italic(chalk.white(...args))
