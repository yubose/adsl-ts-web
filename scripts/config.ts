import path from 'path'

export const endpoint = (function () {
  const base = 'https://public.aitmed.com'
  const baseConfig = 'https://public.aitmed.com/config'
  return {
    base,
    config: {
      root: `${baseConfig}/aitmed.yml`,
      meet: `${baseConfig}/meet.yml`,
      meet2: `${baseConfig}/meet2.yml`,
      landing: `${baseConfig}/www2.yml`,
    },
  } as const
})()

export const paths = (function () {
  const scriptsPath = path.resolve('scripts')
  return {
    scripts: scriptsPath,
    compiled: `${scriptsPath}/compiled`,
    json: `${scriptsPath}/objects`,
    yml: `${scriptsPath}/yml`,
  } as const
})()
