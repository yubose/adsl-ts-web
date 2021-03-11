import noop from 'lodash/noop'
import { LiteralUnion } from 'type-fest'
import CADL from '@aitmed/cadl'
import {
  ComponentType,
  getTagName,
  getAllResolversAsMap,
  NOODL as NOODLUI,
  Resolver,
  Viewport,
} from 'noodl-ui'
import { ComponentObject } from 'noodl-types'
import NOODLUIDOM from 'noodl-ui-dom'
import componentFixtures from './fixtures/components.json'
import signInPage from './fixtures/SignIn.json'
import './styles.css'

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

const baseUrl = `https://s3.us-east-2.amazonaws.com/public.aitmed.com/cadl/meet2_0.33d/`
const assetsUrl = `assets/`
const viewport = new Viewport()
const noodl = new CADL({
  aspectRatio: 1,
  cadlVersion: 'test',
  configUrl: `https://public.aitmed.com/config/meet2d.yml`,
})
const noodlui = new NOODLUI({ viewport })
const noodluidom = new NOODLUIDOM()

noodl.init().then(async () => {
  await noodl.initPage('SignIn', [], {
    builtIn: {
      goto: noop,
    },
  })
  noodlui.init({ viewport })
  noodlui.setPage('SignIn')
  noodlui.use(viewport).use({
    fetch,
    getAssetsUrl: () => assetsUrl,
    getBaseUrl: () => baseUrl,
    getPreloadPages: () => [],
    getPages: () => ['SignIn'],
    getRoot: () => ({ SignIn: signInPage }),
  })

  Object.entries(getAllResolversAsMap).forEach(([name, v]) => {
    const resolver = new Resolver().setResolver(v)
    noodlui.use({ name, resolver })
  })

  console.log(signInPage)

  noodlui.viewport.width = 375
  noodlui.viewport.height = 667
  noodluidom.use(noodlui)
  noodluidom.page
    .on('on:before.render.components', async () => ({
      name: 'SignIn',
      components: noodl.root.SignIn.components,
    }))
    .requestPageChange('SignIn')
    .then((result) => {
      console.log(result)
    })
    .catch(console.error)

  const observeViewport = (utils: any) => {
    const {
      computeViewportSize,
      on,
      setMinAspectRatio,
      setMaxAspectRatio,
      setViewportSize,
    } = utils

    // The viewWidthHeightRatio in cadlEndpoint (app config) overwrites the
    // viewWidthHeightRatio in root config
    const viewWidthHeightRatio =
      noodl.cadlEndpoint?.viewWidthHeightRatio ||
      noodl.getConfig?.()?.viewWidthHeightRatio

    if (viewWidthHeightRatio) {
      const { min, max } = viewWidthHeightRatio
      setMinAspectRatio(min)
      setMaxAspectRatio(max)
    }

    const { aspectRatio, width, height } = computeViewportSize({
      width: innerWidth,
      height: innerHeight,
      previousWidth: innerWidth,
      previousHeight: innerHeight,
    })

    setViewportSize({ width, height })
    noodl.aspectRatio = aspectRatio

    on(
      'resize',
      function onResize({
        aspectRatio,
        width,
        height,
      }: ReturnType<typeof computeViewportSize>) {
        noodl.aspectRatio = aspectRatio
        document.body.style.width = `${width}px`
        document.body.style.height = `${height}px`
        if (noodluidom.page.rootNode) {
          noodluidom.page.rootNode.style.width = `${width}px`
          noodluidom.page.rootNode.style.height = `${height}px`
        }
        noodluidom.render(noodl.root.SignIn.components)
      },
    )
  }
})
