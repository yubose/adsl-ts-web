import ComponentResolver from '../Resolver'
import normalizeProps from '../normalizeProps'

const resolveStyles = new ComponentResolver('resolveStyles')

resolveStyles.setResolver(async (component, options, next) => {
  const { context, getBaseStyles, viewport, getRoot, page, keepVpUnit } =
    options

  component.edit(
    normalizeProps(component.props, component.blueprint, {
      context,
      getBaseStyles,
      keepVpUnit,
      pageName: page?.page,
      root: getRoot(),
      viewport,
    }),
  )

  return next?.()
})

export default resolveStyles
