export const eventId = {
  page: {
    /** Sorted by order of occurrence */
    on: {
      ON_NAVIGATE_START: 'on:navigate.start',
      ON_NAVIGATE_ABORT: 'on:navigate.abort',
      ON_OUTBOUND_REDIRECT: 'on:outbound.redirect',
      ON_DOM_CLEANUP: 'on:dom.cleanup',
      ON_BEFORE_RENDER_COMPONENTS: 'on:before.render.components',
      ON_BEFORE_APPEND_COMPONENT_CHILD_NODE: 'on:before.append.child.node',
      ON_APPEND_NODE: 'on:append.node',
      ON_BEFORE_APPEND_CHILD: 'on:before.append.child',
      ON_AFTER_APPEND_CHILD: 'on:after.append.child',
      ON_REDRAW_BEFORE_CLEANUP: 'on:redraw.before.cleanup',
      ON_CHILD_NODES_RENDERED: 'on:child.nodes.rendered',
      ON_COMPONENTS_RENDERED: 'on:components.rendered',
      ON_NAVIGATE_ERROR: 'on:navigate.error',
      ON_MODAL_STATE_CHANGE: 'on:modal.state.change',
    },
    /** Sorted by order of occurrence */
    status: {
      ANY: 'status:any',
      IDLE: 'status:idle',
      NAVIGATING: 'status:navigating',
      NAVIGATE_ERROR: 'status:navigate.error',
      SNAPSHOT_RECEIVED: 'status:snapshot.received',
      RESOLVING_COMPONENTS: 'status:resolving.components',
      COMPONENTS_RECEIVED: 'status:components.resolved',
      RENDERING_COMPONENTS: 'status:rendering.components',
      COMPONENTS_RENDERED: 'status:components.rendered',
    },
  },
} as const
