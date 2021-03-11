import { LiteralUnion } from 'type-fest'
import { ComponentType, getTagName, NOODL as NOODLUI, Viewport } from 'noodl-ui'
import { ComponentObject } from 'noodl-types'
import NOODLUIDOM from 'noodl-ui-dom'
import componentFixtures from './fixtures/components.json'
import signInPage from './fixtures/SignIn.json'

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
const noodluidom = new NOODLUIDOM()

noodluidom.use(noodlui)

noodlui.viewport.width = 375
noodlui.viewport.height = 667

// const textBoard = noodlui.resolveComponents(
//   componentFixtures.textBoard as ComponentObject,
// )

// const scrollView = noodlui.resolveComponents(
//   componentFixtures.scrollView as ComponentObject,
// )

// const textBoardElem = createElement(getTagName(textBoard), ['text-board'])
// const scrollViewElem = createElement(getTagName(scrollView), ['scroll-view'])

// const components = noodlui.resolveComponents(signInPage.components)

const node = noodluidom.render(signInPage.components)

console.log(node)
