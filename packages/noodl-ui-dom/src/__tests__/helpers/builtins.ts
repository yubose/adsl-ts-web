import { noodluidom } from '../../test-utils'

export const redraw = async (action: any, options: any) => {
  const { component } = options
  const { viewTag } = action.original

  // const node = document.getElementById(component.id)

  // noodluidom.emit('redraw', node, component, action.original)

  noodluidom.redraw(
    document.querySelector(`[data-viewtag="${viewTag}"]`),
    component,
    action.original,
  )

  // console.info('REACHED BUILT INS BLOCK!!!', {
  //   component: component.toString(),
  //   viewTag,
  //   action: action.original,
  // })

  // noodluidom.emit('redraw', )
  // component.redraw?.()
}
