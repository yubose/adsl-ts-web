const chalk = require('chalk')

const captioning = (...s) => chalk.hex('#40E09F')(...s)
const highlight = (...s) => chalk.yellow(...s)
const italic = (...s) => chalk.italic(chalk.white(...s))
const aquamarine = (...s) => chalk.keyword('aquamarine')(...s)
const lightGold = (...s) => chalk.keyword('blanchedalmond')(...s)
const blue = (...s) => chalk.keyword('deepskyblue')(...s)
const fadedBlue = (...s) => chalk.blue(...s)
const cyan = (...s) => chalk.cyan(...s)
const brightGreen = (...s) => chalk.keyword('chartreuse')(...s)
const lightGreen = (...s) => chalk.keyword('lightgreen')(...s)
const green = (...s) => chalk.green(...s)
const coolGold = (...s) => chalk.keyword('navajowhite')(...s)
const gray = (...s) => chalk.keyword('lightslategray')(...s)
const hotpink = (...s) => chalk.hex('#F65CA1')(...s)
const fadedSalmon = (...s) => chalk.keyword('darksalmon')(...s)
const magenta = (...s) => chalk.magenta(...s)
const orange = (...s) => chalk.keyword('lightsalmon')(...s)
const deepOrange = (...s) => chalk.hex('#FF8B3F')(...s)
const purple = (...s) => chalk.keyword('purple')(...s)
const lightRed = (...s) => chalk.keyword('lightpink')(...s)
const coolRed = (...s) => chalk.keyword('lightcoral')(...s)
const red = (...s) => chalk.keyword('tomato')(...s)
const teal = (...s) => chalk.keyword('turquoise')(...s)
const white = (...s) => chalk.whiteBright(...s)
const yellow = (...s) => chalk.yellow(...s)
const newline = () => console.log('')

module.exports = {
  captioning,
  highlight,
  italic,
  aquamarine,
  lightGold,
  blue,
  fadedBlue,
  cyan,
  brightGreen,
  lightGreen,
  green,
  coolGold,
  gray,
  hotpink,
  fadedSalmon,
  magenta,
  orange,
  deepOrange,
  purple,
  lightRed,
  coolRed,
  red,
  teal,
  white,
  yellow,
  newline,
}
