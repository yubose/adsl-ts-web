import { LiteralUnion } from 'type-fest'
import { ComponentType, getTagName, NOODL as NOODLUI, Viewport } from 'noodl-ui'
import { ComponentObject } from 'noodl-types'
import componentFixtures from './fixtures/components.json'

function createElement<T extends ComponentType>(
  type: LiteralUnion<T | ComponentType, string>,
  classes: string[] = [],
) {
  const node = document.createElement(type)
  classes.forEach((className) => {
    node.classList.add(className)
  })
  return node
}

const viewport = new Viewport()
const noodlui = new NOODLUI({ viewport })

viewport.width = 375
viewport.height = 667

const mainViewport = document.getElementById('viewport-main')

mainViewport.style.width = viewport.width + 'px'
mainViewport.style.height = viewport.height + 'px'
mainViewport.style.border = '1px solid magenta'

const textBoard = noodlui.resolveComponents(
  componentFixtures.textBoard as ComponentObject,
)

const scrollView = noodlui.resolveComponents(
  componentFixtures.scrollView as ComponentObject,
)

const textBoardElem = createElement(getTagName(textBoard), ['text-board'])
const scrollViewElem = createElement(getTagName(scrollView), ['scroll-view'])

mainViewport.appendChild(textBoardElem)
mainViewport.appendChild(scrollViewElem)

console.log(textBoardElem)
