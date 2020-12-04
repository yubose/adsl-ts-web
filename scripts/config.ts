import path from 'path'

export type ConfigKey = 'aitmed' | 'meet11' | 'meet2' | 'meet2d'

export type ConfigId = typeof configIds[number]

export const endpoint = (function () {
  const base = 'https://public.aitmed.com'
  const baseConfig = 'https://public.aitmed.com/config'

  const get = (key: ConfigId) => {
    if (['root', 'landing'].includes(key)) {
      const filename =
        key === 'root' ? 'aitmed' : key === 'landing' ? 'ww2' : 'aitmed'
      return `${baseConfig}/${filename}.yml`
    } else {
      return `${baseConfig}/${key}.yml`
    }
  }

  return {
    base,
    get,
  } as const
})()

export const paths = (function () {
  const scriptsPath = path.resolve('scripts')
  return {
    scripts: scriptsPath,
    compiled: `${scriptsPath}/compiled`,
    json: `${scriptsPath}/objects`,
    yml: `${scriptsPath}/serverFiles`,
  } as const
})()
