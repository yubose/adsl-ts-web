/**
 * Progressed from https://spin.js.org/
 */

let defaults = {
  lines: 30,
  length: 7,
  width: 5,
  radius: 10,
  scale: 1.0,
  corners: 1,
  color: '#333',
  fadeColor: 'transparent',
  animation: 'spinner-line-fade-default',
  rotate: 0,
  direction: 1,
  speed: 1,
  zIndex: 2e9,
  className: 'spinner',
  top: '50%',
  left: '50%',
  shadow: '0 0 1px transparent',
  position: 'absolute',
}

export class Spinner {
  animateId: number | undefined
  el: HTMLElement | undefined
  opts: Record<string, any>

  constructor(opts?: Record<string, any>) {
    this.opts = { ...defaults, ...opts }
    if (opts?.containerWidth) {
      this.opts.left = `${opts.containerWidth / 2}px`
    }
  }

  /**
   * Adds the spinner to the given target element. If this instance is already
   * spinning, it is automatically removed from its previous target by calling
   * stop() internally.
   */
  spin(target?: HTMLElement) {
    this.stop()
    this.el = document.createElement('div')
    this.el.className = this.opts.className
    this.el.setAttribute('role', 'progressbar')
    css(this.el, {
      position: this.opts.position,
      width: 0,
      zIndex: this.opts.zIndex,
      left: this.opts.left,
      top: this.opts.top,
      transform: 'scale(' + this.opts.scale + ')',
    })
    if (target) {
      target.insertBefore(this.el, target.firstChild || null)
    }
    drawLines(this.el, this.opts)
    return this
  }

  /**
   * Stops and removes the Spinner.
   * Stopped spinners may be reused by calling spin() again.
   */
  stop() {
    if (this.el) {
      if (typeof requestAnimationFrame !== 'undefined') {
        cancelAnimationFrame(this.animateId as number)
      } else {
        clearTimeout(this.animateId)
      }
      if (this.el.parentNode) {
        this.el.parentNode.removeChild(this.el)
      } else {
        this.el.remove()
      }
      this.el = undefined
    }
    return this
  }
}

/**
 * Sets multiple style properties at once.
 */
function css(el, props) {
  for (let prop in props) {
    el.style[prop] = props[prop]
  }
  return el
}

/**
 * Returns the line color from the given string or array.
 */
function getColor(color, idx) {
  return typeof color == 'string' ? color : color[idx % color.length]
}

/**
 * Internal method that draws the individual lines.
 */
function drawLines(el, opts) {
  let borderRadius = Math.round(opts.corners * opts.width * 500) / 1000 + 'px'
  let shadow = 'none'

  if (opts.shadow === true) {
    shadow = '0 2px 4px #000' // default shadow
  } else if (typeof opts.shadow === 'string') {
    shadow = opts.shadow
  }

  let shadows = parseBoxShadow(shadow)

  for (let i = 0; i < opts.lines; i++) {
    let degrees = ~~((360 / opts.lines) * i + opts.rotate)
    let backgroundLine = css(document.createElement('div'), {
      position: 'absolute',
      top: -opts.width / 2 + 'px',
      width: opts.length + opts.width + 'px',
      height: opts.width + 'px',
      background: getColor(opts.fadeColor, i),
      borderRadius: borderRadius,
      transformOrigin: 'left',
      transform: 'rotate(' + degrees + 'deg) translateX(' + opts.radius + 'px)',
    })

    let delay = (i * opts.direction) / opts.lines / opts.speed
    delay -= 1 / opts.speed // so initial animation state will include trail

    let line = css(document.createElement('div'), {
      width: '100%',
      height: '100%',
      background: getColor(opts.color, i),
      borderRadius: borderRadius,
      boxShadow: normalizeShadow(shadows, degrees),
      animation:
        1 / opts.speed + 's linear ' + delay + 's infinite ' + opts.animation,
    })

    backgroundLine.appendChild(line)
    el.appendChild(backgroundLine)
  }
}

function parseBoxShadow(boxShadow = '') {
  let regex =
    /^\s*([a-zA-Z]+\s+)?(-?\d+(\.\d+)?)([a-zA-Z]*)\s+(-?\d+(\.\d+)?)([a-zA-Z]*)(.*)$/

  let shadows = [] as {
    prefix: string
    x: number
    y: number
    xUnits: string
    yUnits: string
    end: string
  }[]

  for (let _i = 0, _a = boxShadow.split(','); _i < _a.length; _i++) {
    let shadow = _a[_i]
    let matches = shadow.match(regex)
    if (matches === null) {
      continue // invalid syntax
    }
    let x = +matches[2]
    let y = +matches[5]
    let xUnits = matches[4]
    let yUnits = matches[7]
    if (x === 0 && !xUnits) {
      xUnits = yUnits
    }
    if (y === 0 && !yUnits) {
      yUnits = xUnits
    }
    if (xUnits !== yUnits) {
      continue // units must match to use as coordinates
    }
    shadows.push({
      prefix: matches[1] || '',
      x: x,
      y: y,
      xUnits,
      yUnits,
      end: matches[8],
    })
  }
  return shadows
}

/**
 * Modify box-shadow x/y offsets to counteract rotation
 */
function normalizeShadow(shadows, degrees) {
  let normalized = [] as string[]
  for (let _i = 0, shadows_1 = shadows; _i < shadows_1.length; _i++) {
    let shadow = shadows_1[_i]
    let xy = convertOffset(shadow.x, shadow.y, degrees)
    normalized.push(
      shadow.prefix +
        xy[0] +
        shadow.xUnits +
        ' ' +
        xy[1] +
        shadow.yUnits +
        shadow.end,
    )
  }
  return normalized.join(', ')
}

function convertOffset(x, y, degrees) {
  let radians = (degrees * Math.PI) / 180
  let sin = Math.sin(radians)
  let cos = Math.cos(radians)
  return [
    Math.round((x * cos + y * sin) * 1000) / 1000,
    Math.round((-x * sin + y * cos) * 1000) / 1000,
  ]
}
