import ComponentResolver from '../Resolver'
import normalizeProps from '../normalizeProps'

const resolveStyles = new ComponentResolver('resolveStyles')

resolveStyles.setResolver(async (component, options, next) => {
  const { context, getBaseStyles, viewport, getRoot, page } = options

  component.edit(
    normalizeProps(component.props, component.blueprint, {
      context,
      getBaseStyles,
      pageName: page?.page,
      root: getRoot(),
      viewport,
    }),
  )

  return next?.()
})

export default resolveStyles
