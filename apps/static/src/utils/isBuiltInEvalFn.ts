export default function isBuiltInEvalFn(value: Record<string, any>) {
  for (const key of Object.keys(value)) {
    if (key.startsWith('=.builtIn')) return true
  }
  return false
}
