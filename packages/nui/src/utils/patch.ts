import {
  init,
  attributesModule,
  classModule,
  datasetModule,
  eventListenersModule,
  propsModule,
  styleModule,
} from 'snabbdom'

const patch = init([
  attributesModule,
  classModule, // makes it easy to toggle classes
  datasetModule,
  propsModule, // for setting properties on DOM elements
  styleModule, // handles styling on elements with support for animations
  eventListenersModule, // attaches event listeners
])

export default patch
