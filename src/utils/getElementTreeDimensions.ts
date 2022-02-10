export interface Dimensions {
  scrollHeight: number
  width: number
  height: number
  top: number
  bottom: number
  left: number
  right: number
  x: number
  y: number
  children?: Dimensions[]
}

function getBounds(
  el: Element | HTMLElement | null | undefined,
): Omit<Dimensions, 'scrollHeight'> {
  const bounds = (el?.getBoundingClientRect?.() || {}) as DOMRect
  return {
    width: bounds?.width || 0,
    height: bounds?.height || 0,
    top: bounds?.top || 0,
    bottom: bounds?.bottom || 0,
    left: bounds?.left || 0,
    right: bounds?.right || 0,
    x: bounds?.x || 0,
    y: bounds?.y || 0,
  }
}
// let items = [] as any[]
function getDimensions(el: Element | HTMLElement | null | undefined) {
  // items.push(`[${el?.tagName?.toLocaleLowerCase() || ''}] ${el?.id || ''}`)
  return {
    id: el?.id || '',
    scrollHeight: el?.scrollHeight || 0,
    tagName: el?.tagName?.toLowerCase?.() || '',
    ...getBounds(el),
  }
}

function getElementTreeDimensions(
  el: Element | HTMLElement | null | undefined,
): Dimensions {
  const dimensions = getDimensions(el)

  let currChild: typeof el | null = el?.firstElementChild || null

  while (currChild) {
    const dims = getDimensions(currChild)

    if (!dimensions.children) dimensions.children = []

    dimensions.children.push(dims)

    for (const childNode of currChild.children) {
      dimensions.children.push(getElementTreeDimensions(childNode))
    }

    currChild = currChild.nextElementSibling
  }
  return dimensions
}

export default getElementTreeDimensions
