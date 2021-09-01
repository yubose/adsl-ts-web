import {
  attributesModule,
  htmlDomApi as dom,
  init,
  h,
  classModule,
  datasetModule,
  propsModule,
  styleModule,
  eventListenersModule,
  toVNode,
} from 'snabbdom'

const patch = init([
  attributesModule,
  classModule, // makes it easy to toggle classes
  datasetModule,
  propsModule, // for setting properties on DOM elements
  styleModule, // handles styling on elements with support for animations
  eventListenersModule, // attaches event listeners
])

window.addEventListener('load', function (evt) {
  console.log(patch)
})
