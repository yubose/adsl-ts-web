import { init } from 'snabbdom'
import attributesModule from 'snabbdom/modules/attributes'
import classModule from 'snabbdom/modules/class'
import datasetModule from 'snabbdom/modules/dataset'
import eventListenersModule from 'snabbdom/modules/eventlisteners'
import propsModule from 'snabbdom/modules/props'
import styleModule from 'snabbdom/modules/style'

const patch = init([
  attributesModule,
  classModule, // makes it easy to toggle classes
  datasetModule,
  propsModule, // for setting properties on DOM elements
  styleModule, // handles styling on elements with support for animations
  eventListenersModule, // attaches event listeners
])

export default patch
