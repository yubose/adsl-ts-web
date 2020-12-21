import path from 'path'
import fs from 'fs-extra'
import yaml from 'yaml'

export type FileExts = 'json' | 'yml'

export interface SaverOptions {
  dir?: string
  exts?: Partial<Record<FileExts, boolean>>
}

export interface DataOptions<T = any> {
  type?: FileExts
  data?: string | T
  dir?: string
  filename?: string
}

export interface SaveFunc<T = any> {
  (opts?: DataOptions<T> | DataOptions<T>[]): this
}

class Saver {
  #extRegex: RegExp = /\.(json|yml)$/i
  dir: SaverOptions['dir']
  exts: SaverOptions['exts']

  constructor(options: SaverOptions = {}) {
    const { dir, exts } = options
    this['dir'] = dir
    this['exts'] = exts
  }

  save(opts?: DataOptions): Promise<any>
  save(opts?: DataOptions[]): Promise<any>
  async save(opts: DataOptions | DataOptions[]) {
    let filepath: string
    const batches = Array.isArray(opts) ? opts : [opts]
    const numBatches = batches.length

    if (this.dir) fs.ensureDirSync(this.dir)

    for (let index = 0; index < numBatches; index++) {
      const { data, dir = this.dir, filename, type } = batches[index]

      filepath = path.join(dir, filename)

      if (type !== 'yml') {
        await fs.writeJson(filepath, data, { spaces: 2 })
      } else {
        await fs.writeFile(filepath, yaml.stringify(data), { encoding: 'utf8' })
      }
    }
  }

  getExt() {
    return this.exts.json ? '.json' : '.yml'
  }
}

export default Saver
