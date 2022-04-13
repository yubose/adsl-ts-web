process.stdout.write('\x1Bc')
console.log('')
require('dotenv').config()
const cheerio = require('cheerio')
const u = require('@jsmanifest/utils')
const meow = require('meow')
const chalk = require('chalk')
const path = require('path')
const Typedoc = require('typedoc')
const open = require('open')
const fs = require('fs-extra')
const {
  S3Client,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} = require('@aws-sdk/client-s3')
const globby = require('globby')
const mime = require('mime')
const chokidar = require('chokidar')
const ws = require('ws')

const cli = meow(``, {
  flags: {
    build: { alias: 'b', type: 'string' },
    deploy: { alias: 'd', type: 'boolean' },
    watch: { alias: 'w', type: 'boolean' },
  },
})

const { flags } = cli

const aqua = chalk.keyword('aquamarine')
const coolGold = chalk.keyword('navajowhite')
const log = console.log

const tag = {
  wss: `[${chalk.cyan('wss')}]`,
  watcher: `[${chalk.keyword('aquamarine')('watch')}]`,
}
const CWD = path.join(__dirname, '..')
const BASE_DOCS_PATH = path.join(CWD, './generated/docs')

const pkgMap = {
  [`noodl-types`]: {
    docs: path.join(BASE_DOCS_PATH, `./noodl-types`),
    repo: path.join(CWD, `packages/noodl-types`),
  },
}

/** @type { string } */
const name = flags.build || flags.watch

if (!name) {
  throw new Error(
    `Invalid command. Please specify one or more of: ${u.yellow(
      `build`,
    )}, ${u.yellow(`deploy`)}`,
  )
}

/** @type { typeof pkgMap[keyof typeof pkgMap] } */
const { docs: docsPath, repo: repoPath } = pkgMap[name]

log(`
CWD: ${coolGold(CWD)}
Base path: ${coolGold(BASE_DOCS_PATH)}
Path to docs: ${coolGold(docsPath)}
Path to package: ${coolGold(repoPath)}
`)

//
;(async () => {
  try {
    const app = new Typedoc.Application()

    app.options.addReader(new Typedoc.TSConfigReader())
    app.options.addReader(new Typedoc.TypeDocReader())

    app.bootstrap({
      cleanOutputDir: true,
      darkHighlightTheme: 'material-ocean',
      lightHighlightTheme: 'vitesse-light',
      emit: 'docs',
      entryPoints: [path.join(repoPath, './tsconfig.json')],
      exclude: [path.join(repoPath, `./**/*.test.ts`)],
      logLevel: 'Verbose',
      name,
      out: docsPath,
      pretty: true,
      readme: 'none',
      showConfig: true,
      sort: ['required-first', 'alphabetical'],
      tsconfig: path.join(repoPath, './tsconfig.json'),
    })

    /**
     * "jsx": "react",
       "jsxFactory": "JSX.createElement",
       "jsxFragmentFactory": "JSX.Fragment"} project
     */

    const startWatcher = (project) => {
      const onEvt =
        (label) =>
        (fn) =>
        (...args) => {
          log(`[${chalk.yellow(label)}] fired`)
          return fn(...args)
        }

      let wss = new ws.Server({ host: '127.0.0.1', port: 3002 })
      let watcher = chokidar.watch([path.join(docsPath, './assets/**/*')], {
        cwd: docsPath,
        ignoreInitial: true,
        persistent: true,
      })

      wss.on('connection', () => u.log(`${tag.wss} Connected to WSS`))
      wss.on('listening', () => {
        u.log(`${tag.wss} Now listening`)

        watcher.on('ready', async () => {
          u.log(
            `${tag.watcher} Watching ${
              u.keys(watcher.getWatched()).length
            } files`,
          )
        })

        watcher.on('change', async (filepath, stats) => {
          u.log(
            `${tag.watcher} ${u.cyan(`File change detected. Reloading...`)}`,
          )
          // watcher.add(path.join(docsPath, `./**/*`))
          wss.clients.forEach((socket) =>
            socket.send(JSON.stringify({ type: 'change', filepath, stats })),
          )
        })

        watcher.on('add', onEvt('add'))
        watcher.on('addDir', onEvt('add'))
        watcher.on('error', onEvt('add'))
        watcher.on('raw', onEvt('add'))
        watcher.on('unlink', onEvt('add'))
        watcher.on('unlinkDir', onEvt('add'))
      })
    }

    if (flags.watch) {
      log(u.cyan(`Watching...`))

      let project = app.convert()

      const { directory, files, packageInfo, sources } = project
    } else {
      const project = app.convert()
      const bucket = 'nui-typedoc'
      const region = 'us-west-1'
      const url =
        'https://nui-typedoc.s3.us-west-1.amazonaws.com/noodl-types/index.html'
      const s3 = new S3Client({
        region,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY,
          secretAccessKey: process.env.AWS_SECRET_KEY,
        },
      })

      async function upload(filepath) {
        const fileInfo = path.parse(filepath)
        const key = path.join(name, fileInfo.base)
        let contentType = filepath.endsWith('.ts')
          ? 'application/x-typescript'
          : mime.lookup(filepath, 'text/plain')

        log(
          `[${coolGold('Uploading')}] ${fileInfo.base} [${u.yellow(
            'Key',
          )}: ${u.white(key)}]`,
        )

        await s3.send(
          new PutObjectCommand({
            Bucket: bucket,
            Body: await fs.readFile(filepath),
            Key: key,
            ContentEncoding: 'utf8',
            ContentType: contentType,
          }),
        )
      }

      /** @returns { Promise<S3.ObjectList> } */
      async function getBucketObjects() {
        try {
          log(u.white(`Retrieving bucket objects`))
          const data = await s3.send(
            new ListObjectsV2Command({ Bucket: bucket, Prefix: name }),
          )
          log(`Received ${u.yellow(data.Contents.length)} objects`)
          return data.Contents
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error))
          throw err
        }
      }

      /**
       * @param { S3.ObjectList } objects
       * @returns { Promise<S3.DeleteObjectsOutput> }
       */
      async function deleteBucketObjects(objects) {
        try {
          if (!objects.length) return
          log(`Deleting ${u.yellow(objects.length)} old files...`)
          const data = await s3.send(
            new DeleteObjectsCommand({
              Bucket: bucket,
              Delete: {
                Objects: objects.map((obj) => ({ Key: obj.Key })),
              },
            }),
          )
          return data
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error))
          throw err
        }
      }

      await deleteBucketObjects(await getBucketObjects())
      await app.generateDocs(project, docsPath)

      // const htmlFile = await fs.readFile(path.join(docsPath, './index.html'))
      // const $ = cheerio.load(htmlFile)
      // $('body').append(`
      // <script type="text/javascript">
      //   const ws = new WebSocket("ws://127.0.0.1:3002");
      //   ws.addEventListener("ready", () => console.log(\'READY\'));
      //   ws.addEventListener("message", ({data:msg}) => {
      //     if (msg && typeof msg === 'string') msg = JSON.parse(msg)
      //     if (msg.type === 'change') window.location.reload()
      //   });
      // </script>`)
      // await fs.writeFile(path.join(docsPath, './index.html'), $.html(), '')

      // startWatcher(project)
      log(chalk.keyword('lightgreen')(`Docs generated`))

      open(path.join(docsPath, './index.html'))

      if (flags.deploy) {
        log(u.white(`Deploying to s3`))

        const files = await globby(path.join(docsPath, './**/*'), {
          cwd: docsPath,
        })

        await Promise.all(files.map(async (filepath) => upload(filepath)))
        log(u.green(`${files.length} files have been uploaded`))

        open(url)
      }
    }
  } catch (error) {
    throw error
  }
})()
