import fs from 'fs-extra'
import _ from 'lodash'
import yaml, { Document } from 'yaml'
import path from 'path'

export async function ensureJsonFile(filepath: string) {
  try {
    if (!fs.existsSync(filepath)) {
      await fs.ensureFile(filepath)
      await fs.writeJson(filepath, {}, { encoding: 'utf8' })
    } else {
      const file = await fs.readFile(filepath, 'utf8')
      try {
        JSON.parse(file)
      } catch (error) {
        await fs.writeJson(filepath, {}, { encoding: 'utf8' })
        await fs.readJson(filepath, { encoding: 'utf8' })
      }
    }
  } catch (error) {
    console.error(error)
  }
}

export interface ResultObject {
  filename: string
  ext: string
  filepath: string
  doc: Document
}

export interface Options {
  dir: string
  files?: string | string[]
  returnAs: 'doc' | 'object'
}

/**
 * Retrieves the files in a directory as yaml document nodes (higher level than json objects)
 * @param { string } dir - Directory
 */
export async function getDirFilesAsDocNodes(
  dir: string | Options,
): Promise<Document[] | ResultObject[]> {
  let filenames: string[],
    results: Document[] | ResultObject[] = []

  if (_.isString(dir)) {
    filenames = await fs.readdir(dir)
    for (let index = 0; index < filenames.length; index++) {
      const filename = filenames[index]
      const filepath = path.resolve(dir, filename)
      const data = await getFileAsDocNode(filepath)
      // @ts-ignore
      if (data) results.push(data)
    }
  } else if (_.isPlainObject(dir)) {
    let { dir: _dir, files, returnAs } = dir
    filenames = await fs.readdir(_dir)

    if (files) {
      if (_.isString(files)) files = [files]
      // Only look for the given file names in the given directory
      filenames = filenames.filter((filename) => {
        for (let index = 0; index < files.length; index++) {
          const fileToLookFor = files[index]
          if (filename.includes(fileToLookFor)) {
            return true
          }
        }
        return false
      })
    }

    for (let index = 0; index < filenames.length; index++) {
      const fullFileName = filenames[index]
      const filename = fullFileName.substring(0, fullFileName.indexOf('.'))
      const ext = fullFileName.substring(fullFileName.lastIndexOf('.'))
      const filepath = path.resolve(_dir, fullFileName)

      if (!fs.statSync(filepath).isDirectory()) {
        if (returnAs === 'object') {
          // @ts-ignore
          results.push({
            filename,
            ext,
            filepath,
            doc: await getFileAsDocNode(filepath),
          })
        } else {
          results.push(
            // @ts-ignore
            await getFileAsDocNode(path.resolve(_dir, `${filename}${ext}`)),
          )
        }
      }
    }
  }

  return results
}

export interface DescriptiveItem {
  filename: string
  filepath: string
  data: any
}

/**
 * Retrieves the files in a directory as json
 * @param { string } dir - Directory
 */
export async function getDirFilesAsJson(
  dir: string,
  { asDescriptives = false }: { asDescriptives?: boolean } = {},
) {
  const files = []
  const filenames = await fs.readdir(dir)
  for (let index = 0; index < filenames.length; index++) {
    const filename = filenames[index]
    const filepath = path.resolve(dir, filename)
    const data = await getFileAsJson(filepath)
    if (data) {
      if (!asDescriptives) {
        files.push(data)
      } else {
        files.push({
          data,
          filename,
          filepath,
        })
      }
    }
  }
  return files
}

/**
 * Retrieves the file as json
 * @param { string } filepath - Path to the file
 */
async function getFileAsJson(filepath: string) {
  if (!fs.statSync(filepath).isDirectory()) {
    return fs.readJson(filepath)
  }
}

/**
 * Retrieves the file as a yaml document node (higher level than json objects)
 * @param { string } filepath - Path to the file
 */
async function getFileAsDocNode(filepath: string): Promise<Document> {
  if (!fs.statSync(filepath).isDirectory()) {
    let file: any = await fs.readFile(filepath, { encoding: 'utf8' })
    try {
      file = yaml.parseDocument(file)
    } catch (error) {
      console.error(error)
    }
    return file
  }
}
