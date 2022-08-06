import { enablePatches } from 'immer'
enablePatches()
import 'react-toastify/dist/ReactToastify.css'
import wrapWithProviders from './wrapWithProviders'

export function onClientEntry() {}

/**
 * @param { import('gatsby').RouteUpdateArgs } param0
 */
export function onPreRouteUpdate({ location, prevLocation }) {}

/**
 * @param { import('gatsby').RouteUpdateArgs } param0
 */
export function onRouteUpdate({ location, prevLocation }) {}

/**
 * @param { import('gatsby').ShouldUpdateScrollArgs } args
 */
export function shouldUpdateScroll(args) {}

export function onInitialClientRender() {}

/**
 * @param { import('gatsby').PrefetchPathnameArgs } args
 */
export function onPrefetchPathname(args) {}

/**
 * @param { import('gatsby').PrefetchPathnameArgs } args
 */
export function onPostPrefetchPathname(args) {}

/**
 * @param { import('gatsby').RouteUpdateDelayedArgs } args
 */
export function onRouteUpdateDelayed(args) {}

/**
 * @param { import('gatsby').ServiceWorkerArgs } args
 */
export function onServiceWorkerInstalled(args) {}

/**
 * @param { import('gatsby').ServiceWorkerArgs } args
 */
export function onServiceWorkerActive(args) {}

/**
 * @param { import('gatsby').ServiceWorkerArgs } args
 */
export function onServiceWorkerRedundant(args) {}

/**
 * @param { import('gatsby').ServiceWorkerArgs } args
 */
export function onServiceWorkerUpdateFound(args) {}
/**
 * @param { import('gatsby').ServiceWorkerArgs } args
 */
export function onServiceWorkerUpdateReady(args) {}

// export function replaceHydrateFunction() {
//   return (element, container, callback) => {
//     console.log(`[replaceHydrateFunction] Rendering`)
// ReactDOM.render(element, container, callback)
//   }
// }

export const wrapRootElement = wrapWithProviders
