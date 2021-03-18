global.window = { console: { log: () => {} } }
const isNaN = require('lodash/isNaN')
const VP = require('noodl-ui').Viewport

const hasLetter = (v) => /[a-zA-Z]/i.test(v)
const hasDec = (v) => Number(v) % 1 !== 0
const isNum = (v) => typeof v === 'number'
const isObj = (v) => v !== null && !Array.isArray(v) && typeof v === 'object'
const isStr = (v) => typeof v === 'string'
const isUnd = (v) => typeof v === 'undefined'
const toNum = (v) => Number(String(v).replace(/[a-zA-Z]+/g, ''))
const isX = (v) => v in xMap
const isY = (v) => v in yMap

const xMap = {
  BORDER_RIGHT: 'borderRight',
  BORDER_LEFT: 'borderLeft',
  MARGIN_RIGHT: 'marginRight',
  MARGIN_LEFT: 'marginLeft',
  PADDING_RIGHT: 'paddingRight',
  PADDING_LEFT: 'paddingLeft',
  LEFT: 'left',
  WIDTH: 'width',
  LETTER_SPACING: 'letterSpacing',
}

const yMap = {
  BORDER_TOP: 'borderTop',
  BORDER_BOTTOM: 'borderBottom',
  MARGIN_TOP: 'marginTop',
  MARGIN_BOTTOM: 'marginBottom',
  PADDING_TOP: 'paddingTop',
  PADDING_BOTTOM: 'paddingBottom',
  TOP: 'top',
  HEIGHT: 'height',
  LINE_HEIGHT: 'lineHeight',
  LINE_SPACING: 'lineSpacing',
}

const c = {
  ...xMap,
  ...yMap,
  BORDER: 'border',
  FONT_SIZE: 'fontSize',
  MARGIN: 'margin',
  PADDING: 'padding',
}

const sizables = Object.values(c)

function NOODLPos() {}

const pos = new NOODLPos()

function getTop() {
  let results = []
}

// console.log(VP.getSize('0.2', 667))

const fib = (n) => {
  let results = [0, 1]
  for (let i = 2; i <= n; i++) {
    results[i] = results[i - 1] + results[i - 2]
  }
  return results[n]
}

console.log(fib(34))
