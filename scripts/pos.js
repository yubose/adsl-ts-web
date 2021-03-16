const { expect } = require('chai')
const isNaN = require('lodash/isNaN')

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

function NOODLPosition() {}

NOODLPosition.prototype.getDimensions = function getDimensions(obj) {
  const dims = {}

  if (isObj(obj)) {
    let x = 0
    let y = 0

    sizables.forEach((s) => {
      if (s in obj) {
        if (isX(s)) {
          //
        } else if (isY(y)) {
          //
        }
      }
    })
  }

  return dims
}

NOODLPosition.prototype.getSize = function getSize(
  value,
  maxViewportSize,
  { unit } = {},
) {
  let result

  if (value == '0') {
    result = 0
  } else if (value == '1') {
    result = maxViewportSize
  } else if (isStr(value)) {
    if (!hasLetter(value)) {
      result = Number(value) * maxViewportSize
    } else {
      result = toNum(value)
    }
  } else if (isNum(value)) {
    if (hasDec(value)) {
      result = value * maxViewportSize
    } else {
      result = value
    }
  }

  result = !isUnd(result)
    ? unit
      ? `${result}${unit}`
      : Number(result)
    : result

  if (isNaN(result)) throw new Error(`Encountered a NaN (invalid) value`)
  if (result === null) throw new Error(`null is not allowed`)
  if (result === undefined) throw new Error(`undefined is not allowed`)

  return result
}

const pos = new NOODLPosition()

describe(`when parent has both top and height`, () => {
  describe(`parent: { width: "0.2", height: "0.5" }`, () => {
    const parentDims = { width: '0.2', height: '0.5' }

    it(`should calculate the child's dimensions correctly`, () => {
      const viewport = { width: 375, height: 667 }
      expect(pos.getSize('0.2', viewport.width)).to.eq(75)
    })
  })
})
