import { LiteralUnion } from 'type-fest'
import { ComponentObject } from 'noodl-types'
import NOODLUIDOM from '../packages/noodl-ui-dom'
import {
  ComponentType,
  getAllResolversAsMap,
  NOODL as NOODLUI,
  Resolver,
  Viewport,
} from '../packages/noodl-ui'
import App from './App'
import createActions from './actions'
import createBuiltIns from './builtIns'
import styles from './styles.module.css'
import PrivacyPolicy from './fixtures/PrivacyPolicy.json'
import componentFixtures from './fixtures/components.json'
import { getAspectRatio } from './utils/common'

const array = <O>(o: O | O[]): any[] => (Array.isArray(o) ? o : [o])

const aitmedLogoUrl =
  'https://s3.us-east-2.amazonaws.com/public.aitmed.com/cadl/meet2_0.33d/assets/mLogo.png'

function createElement<T extends ComponentType>(
  type: LiteralUnion<T | ComponentType, string>,
  {
    style = {},
    classes = [],
    ...rest
  }: { classes?: string | string[]; style?: any } & { [key: string]: any } = {},
) {
  const node = document.createElement(type)

  array(classes).forEach((className: string) => {
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
viewport.width = 375
viewport.height = 667

const app = new App()
// const noodl = new CADL({
//   aspectRatio:
//     typeof window !== 'undefined'
//       ? getAspectRatio(window.innerWidth, window.innerHeight)
//       : 1,
//   cadlVersion: process.env.ECOS_ENV === 'stable' ? 'stable' : 'test',
//   configUrl: 'http://127.0.0.1,',
// })
const noodlui = new NOODLUI({ viewport })
const noodluidom = new NOODLUIDOM()

Object.entries(getAllResolversAsMap).forEach(([name, resolver]) => {
  // noodlui.use(new Resolver().setResolver(resolver))
  noodlui.use({ name, resolver })
})

noodlui
  .init({
    actionsContext: {
      noodl: {},
      noodluidom,
    } as any,
  })
  .setPage('PrivacyPolicy')
  .use(viewport)
  .use({
    fetch,
    getAssetsUrl: () =>
      'https://s3.us-east-2.amazonaws.com/public.aitmed.com/cadl/meet2_0.33d/assets/',
    getBaseUrl: () =>
      'https://s3.us-east-2.amazonaws.com/public.aitmed.com/cadl/meet2_0.33d/',
    getPreloadPages: () => [],
    getPages: () => [],
    getRoot: () => ({ PrivacyPolicy }),
  })

noodluidom.use(noodlui)
createActions({
  noodl: { root: () => ({ PrivacyPolicy }) },
  noodlui,
  noodluidom,
})
createBuiltIns({
  noodl: { root: () => ({ PrivacyPolicy }) },
  noodlui,
  noodluidom,
})
noodluidom.use(noodlui)

const toggler = document.getElementById('toggler') as HTMLButtonElement
const mainViewport = createElement('div', {
  id: 'viewport-main',
  classes: styles.viewport,
})

// mainViewport.style.width = viewport.width + 'px'
// mainViewport.style.height = viewport.height + 'px'

noodlui.viewport.onResize = function onResize(
  this: App,
  { aspectRatio, width, height }: any,
) {
  // noodl.aspectRatio = aspectRatio
  document.body.style.width = `${width}px`
  document.body.style.height = `${height}px`
  if (noodluidom.page.rootNode) {
    noodluidom.page.rootNode.style.width = `${width}px`
    noodluidom.page.rootNode.style.height = `${height}px`
  }
  noodluidom.render(PrivacyPolicy?.components)
}

// const globalPopUp = noodlui.resolveComponents(componentFixtures.globalPopUp)
// const globalPopUpElem = createElement(getTagName(globalPopUp), {
//   classes: [styles.popUp, styles.popUpGlobal, styles.hidden],
// })
// const img = createElement(
//   getTagName(noodlui.resolveComponents({ type: 'image', path: aitmedLogoUrl })),
// )

noodluidom.render(PrivacyPolicy.components)

// console.log(globalPopUpElem)

// document.body.appendChild(globalPopUpElem)

function isHidden(node: HTMLElement) {
  return node?.classList?.contains(styles.hidden)
}

function hide(node: HTMLElement) {
  node?.classList?.add(styles.hidden)
}

function show(node: HTMLElement) {
  node?.classList?.remove(styles.hidden)
}

// toggler.onclick = function onCick() {
// isHidden(globalPopUpElem) ? show(globalPopUpElem) : hide(globalPopUpElem)
// }

const viewportElems = document.getElementsByClassName('viewport')
