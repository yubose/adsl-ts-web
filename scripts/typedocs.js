process.stdout.write('\x1Bc')
console.log('')
require('dotenv').config()
const u = require('@jsmanifest/utils')
const meow = require('meow')
const del = require('del')
const chalk = require('chalk')
const path = require('path')
const Typedoc = require('typedoc')
const fs = require('fs-extra')
const S3 = require('aws-sdk/clients/s3')
const globby = require('globby')
const mime = require('mime')
const chokidar = require('chokidar')
const ws = require('ws')

const cli = meow(``, {
  flags: {
    deploy: { alias: 'd', type: 'boolean' },
    watch: { alias: 'w', type: 'boolean' },
  },
})

const tag = {
  wss: `[${chalk.cyan('wss')}]`,
  watcher: `[${chalk.keyword('aquamarine')('watch')}]`,
}

;(async () => {
  try {
    if (fs.existsSync('./docs')) {
      await del('./docs')
      console.log(u.white(`Removed docs dir`))
    }

    const baseDir = 'docs'
    const app = new Typedoc.Application()

    app.options.addReader(new Typedoc.TSConfigReader())

    app.bootstrap({
      // highlightTheme: 'material-lighter',
      exclude: ['**/*.test.ts'],
      entryPoints: ['packages/noodl-ui/src/index.ts'],
      tsconfig: 'packages/noodl-ui/tsconfig.json',
      name: 'noodl-ui',
      theme: './scripts/typedoc-theme',
      // watch: !!cli.flags.watch,
      hideGenerator: true,
      pretty: true,
      showConfig: true,
    })

    if (cli.flags.watch) {
      console.log(u.cyan(`Watching...`))
      const onEvt =
        (label) =>
        (fn) =>
        (...args) => {
          console.log(`[${chalk.yellow(label)}] fired`)
          return fn(...args)
        }

      let project = app.convert()

      const { directory, files, packageInfo, sources } = project

      let wss = new ws.Server({ host: '127.0.0.1', port: 3002 })
      let watcher = chokidar.watch('**/*', {
        cwd: 'scripts/typedoc-theme',
        ignoreInitial: true,
        persistent: true,
      })

      wss.on('connection', () => u.log(`${tag.wss} Connected to WSS`))
      wss.on('listening', () => {
        u.log(`${tag.wss} Now listening`)

        watcher.on('ready', async () => {
          await app.generateDocs(project, './docs')
          u.log(
            `${tag.watcher} Watching ${
              u.keys(watcher.getWatched()).length
            } files`,
          )
        })

        watcher.on('change', async (filepath, stats) => {
          watcher.unwatch('**/*')
          console.log(watcher.getWatched())
          u.log(
            `${tag.watcher} ${u.cyan(`File change detected. Reloading...`)}`,
          )
          await del('./docs/**/*')
          project = app.convert()
          await app.generateDocs(project, './docs')
          watcher.add('**/*')
          u.log(`${tag.watcher} ${u.green(`Reloaded`)}`)
          u.log(
            `${tag.watcher} Watching ${
              u.keys(watcher.getWatched()).length
            } files after changed`,
          )
          wss.clients.forEach((socket) =>
            socket.send({ type: 'change', filepath, stats }),
          )
        })

        watcher.on('add', onEvt('add'))
        watcher.on('addDir', onEvt('add'))
        watcher.on('error', onEvt('add'))
        watcher.on('raw', onEvt('add'))
        watcher.on('unlink', onEvt('add'))
        watcher.on('unlinkDir', onEvt('add'))
      })
    } else {
      if (fs.existsSync('./docs')) {
        await del('./docs')
        console.log(u.white(`Removed docs dir`))
      }

      const project = app.convert()

      if (project) {
        const bucket = 'nui-typedoc'
        const region = 'us-west-1'
        const url = 'https://nui-typedoc.s3.us-west-1.amazonaws.com/index.html'
        const s3 = new S3({
          region,
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_JSM,
            secretAccessKey: process.env.AWS_SECRET_KEY_JSM,
          },
        })

        async function upload(filepath) {
          return new Promise(async (resolve, reject) => {
            const fileInfo = path.parse(filepath)
            const key = path.join(fileInfo.dir, fileInfo.base)
            let contentType = filepath.endsWith('.ts')
              ? 'application/x-typescript'
              : mime.lookup(filepath, 'text/plain')

            console.log(`Uploading ${u.yellow(filepath)}`, {
              contentType,
              base: fileInfo.base,
              dir: fileInfo.dir,
              key,
            })

            s3.putObject(
              {
                Bucket: bucket,
                Body: fs.readFileSync(
                  path.resolve(
                    path.join(
                      process.cwd(),
                      baseDir,
                      fileInfo.dir,
                      fileInfo.base,
                    ),
                  ),
                ),
                Key: key,
                ContentEncoding: 'utf8',
                ContentType: contentType,
              },
              (err, data) => {
                if (err) reject(err)
                resolve(data)
              },
            )
          })
        }

        /** @returns { Promise<S3.ObjectList> } */
        function getBucketObjects() {
          return new Promise((resolve, reject) => {
            console.log(u.white(`Retrieving bucket objects`))
            s3.listObjectsV2({ Bucket: bucket }, (err, data) => {
              if (err) reject(err)
              console.log(`Received ${u.yellow(data.Contents.length)} objects`)
              resolve(data.Contents)
            })
          })
        }

        /**
         * @param { S3.ObjectList } objects
         * @returns { Promise<S3.DeleteObjectsOutput> }
         */
        function deleteBucketObjects(objects) {
          return new Promise((resolve, reject) => {
            if (!objects.length) return resolve()
            console.log(`Deleting ${u.yellow(objects.length)} old files...`)
            s3.deleteObjects(
              {
                Bucket: bucket,
                Delete: {
                  Objects: objects.map((obj) => ({ Key: obj.Key })),
                },
              },
              (err, data) => {
                if (err) reject(err)
                resolve(data)
              },
            )
          })
        }

        await deleteBucketObjects(await getBucketObjects())
        await app.generateDocs(project, './docs')

        console.log(u.green(`Docs generated`))

        if (cli.flags.deploy) {
          console.log(u.white(`Deploying to s3`))
          const files = await globby('**/*', { cwd: 'docs' })
          await Promise.all(files.map(async (filepath) => upload(filepath)))
          console.log(u.green(`${files.length} files have been uploaded`))
        }
      }
    }
  } catch (error) {
    throw error
  }
})()
