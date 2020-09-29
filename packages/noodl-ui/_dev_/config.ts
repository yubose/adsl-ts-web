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
  const _dev_path = path.resolve('_dev_')
  return {
    _dev_: _dev_path,
    compiled: `${_dev_path}/compiled`,
    json: `${_dev_path}/objects`,
    yml: `${_dev_path}/yml`,
  } as const
})()
