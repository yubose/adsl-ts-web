// TODO - Implement in noodl-types
function trimVarReference<V extends string = 'var', S extends string = string>(
  ref: `$${V}${S}`,
): S {
  if (ref.startsWith('$')) ref = ref.substring(1) as any
  return ref.split('.').slice(1).join() as S
}

export default trimVarReference
