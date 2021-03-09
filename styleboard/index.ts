import { LiteralUnion } from 'type-fest'
import { ComponentType, getTagName, NOODL as NOODLUI, Viewport } from 'noodl-ui'
import { ComponentObject } from 'noodl-types'
import componentFixtures from './fixtures/components.json'

function createElement<T extends ComponentType>(
  type: LiteralUnion<T | ComponentType, string>,
  {
    style = {},
    classes = [],
    ...rest
  }: { classes?: string[]; style?: any } & { [key: string]: any } = {},
) {
  const node = document.createElement(type)
  classes.forEach((className) => {
    node.classList.add(className)
  })
  // eslint-disable-next-line
  for (const [key, val] of Object.entries(style)) {
    node.style[key as any] = String(val)
  }
  // eslint-disable-next-line
  for (const [key, val] of Object.entries(rest)) {
    // @ts-expect-error
    node[key] = val
  }
  return node
}

const viewport = new Viewport()
const noodlui = new NOODLUI({ viewport })

viewport.width = 375
viewport.height = 667

const rootElem = document.getElementById('root')
const mainViewport = createElement('div', { id: 'viewport-main' })
rootElem?.appendChild(mainViewport)

mainViewport.style.width = viewport.width + 'px'
mainViewport.style.height = viewport.height + 'px'
mainViewport.style.border = '1px solid magenta'

const textBoard = noodlui.resolveComponents(
  componentFixtures.textBoard as ComponentObject,
)

const scrollView = noodlui.resolveComponents(
  componentFixtures.scrollView as ComponentObject,
)

const textBoardElem = createElement(getTagName(textBoard), {
  classes: ['text-board'],
})

const scrollViewElem = createElement(getTagName(scrollView), {
  classes: ['scroll-view'],
})

console.log(rootElem)
console.log(rootElem)
console.log(rootElem)

mainViewport.appendChild(textBoardElem)
mainViewport.appendChild(scrollViewElem)
