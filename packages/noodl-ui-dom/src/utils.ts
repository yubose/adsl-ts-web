export const get = <T = any>(o: T, k: string) => {
  if (typeof o !== 'object' || typeof k !== 'string') return

  let parts = k.split('.').reverse()
  let result: any = o
  let key = ''

  while (parts.length) {
    key = parts.pop() as string
    result = result[key]
  }

  return result
}
