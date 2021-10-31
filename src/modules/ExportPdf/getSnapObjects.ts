import isElement from '../../utils/isElement'

const pageWidth = 363
const pageHeight = 676.7897338867188

function getBounds(el: HTMLElement | DOMRect, position: number) {
  const { height } = (isElement(el) ? el.getBoundingClientRect() : el) || {}
  return {
    start: position,
    end: position + height,
    height,
  }
}

function getSnapObjects(el: HTMLLIElement, position = 0) {
  let accumulatedHeight = 0
  let result = {
    start: {
      position,
      node: el,
    },
    end: {
      position,
      node: null,
    },
  } as {
    start: {
      position: number
      node: HTMLElement
    }
    end: {
      position: number
      node: HTMLElement | null
    }
  }

  if (el.children.length) {
    for (const child of el.children) {
      if (isElement(child)) {
        const { end, height } = getBounds(child, position)

        const nextHeight = accumulatedHeight + height

        if (nextHeight > pageHeight) {
          result.end.position = position
          result.end.node = child
          break
        } else {
          position = end
        }
      }
    }
  } else {
    result.end.position = getBounds(el).end
  }

  return result
}

export default getSnapObjects
