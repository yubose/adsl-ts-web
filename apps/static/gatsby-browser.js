import { enablePatches } from 'immer'
enablePatches()
import 'react-toastify/dist/ReactToastify.css'
import wrapWithProviders from './wrapWithProviders'

export function onClientEntry() {
  console.log(`[onClientEntry]`)
}

// export function registerServiceWorker({
//   getResourceURLsForPathname,
//   loadPage,
//   loadPageSync,
// }) {
//   if (typeof window === 'undefined') return
//   console.log('[registerServiceWorker]', {
//     urlResourcesForCurrentPathname: getResourceURLsForPathname(
//       window.location?.pathname || '',
//     ),
//   })
// }

/**
 * @param { import('gatsby').RouteUpdateArgs } param0
 */
export function onPreRouteUpdate({ location, prevLocation }) {
  const from = prevLocation?.pathname || ''
  const to = location.pathname || ''
  console.log(
    `[onPreRouteUpdate] Gatsby started to change the location from ${from} to ${to}`,
  )
}

/**
 * @param { import('gatsby').RouteUpdateArgs } param0
 */
export function onRouteUpdate({ location, prevLocation }) {
  const from = prevLocation?.pathname || ''
  const to = location.pathname || ''
  console.log(`[onRouteUpdate] Gatsby changed location from ${from} to ${to}`)
}

/**
 * @param { import('gatsby').ShouldUpdateScrollArgs } args
 */
export function shouldUpdateScroll(args) {
  console.log(`[shouldUpdateScroll]`, args)
}

export function onInitialClientRender() {
  console.log(`[onInitialClientRender]`)
}

/**
 * @param { import('gatsby').PrefetchPathnameArgs } args
 */
export function onPrefetchPathname(args) {
  console.log(`[onPrefetchPathname]`, args)
}

/**
 * @param { import('gatsby').PrefetchPathnameArgs } args
 */
export function onPostPrefetchPathname(args) {
  console.log(`[onPostPrefetchPathname]`, args)
}

/**
 * @param { import('gatsby').RouteUpdateDelayedArgs } args
 */
export function onRouteUpdateDelayed(args) {
  console.log('[onRouteUpdateDelayed]', args)
}

/**
 * @param { import('gatsby').ServiceWorkerArgs } args
 */
export function onServiceWorkerInstalled(args) {
  console.log('[onServiceWorkerInstalled]', args)
}

/**
 * @param { import('gatsby').ServiceWorkerArgs } args
 */
export function onServiceWorkerActive(args) {
  console.log('[onServiceWorkerActive]', args)
}

/**
 * @param { import('gatsby').ServiceWorkerArgs } args
 */
export function onServiceWorkerRedundant(args) {
  console.log('[onServiceWorkerRedundant]', args)
}

/**
 * @param { import('gatsby').ServiceWorkerArgs } args
 */
export function onServiceWorkerUpdateFound(args) {
  console.log('[onServiceWorkerUpdateFound]', args)
}
/**
 * @param { import('gatsby').ServiceWorkerArgs } args
 */
export function onServiceWorkerUpdateReady(args) {
  console.log('[onServiceWorkerUpdateReady]', args)
}

// export function replaceHydrateFunction() {
//   return (element, container, callback) => {
//     console.log(`[replaceHydrateFunction] Rendering`)
// ReactDOM.render(element, container, callback)
//   }
// }

export const wrapRootElement = wrapWithProviders
