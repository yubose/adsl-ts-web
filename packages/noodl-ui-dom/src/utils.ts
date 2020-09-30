/**
 * Composes funcs and runs forEach on them, passing args as arguments on
 * each of them
 * @param { ...function[] } fns
 */
export function composeForEachFns<Func extends (...args: any[]) => any>(
  ...fns: Func[]
) {
  return (...args: Parameters<Func>) => {
    fns.forEach((fn) => fn && fn(...args))
  }
}
