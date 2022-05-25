/**
 * Generates a module of our web app which exports our app files
 * @example
 * const { App } = require('../lib')
 * const app = new App()
 * app.initialize()
 */
const del = require('del')
const fs = require('fs-extra')
const path = require('path')
const u = require('@jsmanifest/utils')
const rollup = require('rollup')
const { nodeResolve } = require('@rollup/plugin-node-resolve')
const filesize = require('rollup-plugin-filesize')
const json = require('@rollup/plugin-json')
const progress = require('rollup-plugin-progress')
const commonjs = require('@rollup/plugin-commonjs')
const esbuild = require('rollup-plugin-esbuild').default
const external = require('rollup-plugin-peer-deps-external')
const polyfills = require('rollup-plugin-node-polyfills')

/**
 * @param { import('../bin/cli').ScriptUtils } args
 * @param { string } outDir
 * @returns { Promise<void> }
 */
async function bundleWebApp({ exec, flags, log }, outDir) {
  try {
    if (fs.existsSync(outDir)) del.sync(outDir, { force: true })

    const extensions = ['.js', '.ts']
    const _DEV_ = process.env.NODE_ENV === 'development'
    const inputFile = 'src/lib.ts'

    /** @type { import('rollup').OutputOptions } */
    const outputOptions = {
      dir: './lib',
      exports: 'named',
      format: 'cjs',
      name: 'aitmedNoodlWeb',
      sourcemap: 'hidden',
      entryFileNames(chunkInfo) {
        if (chunkInfo.name === 'lib') return `index.js`
        return chunkInfo.name
      },
    }

    const rollupConfig = rollup.defineConfig({
      input: inputFile,
      external: ['@aitmed/ecos-lvl2-sdk', '@aitmed/cadl', /firebase/],
      treeshake: false,
      plugins: [
        commonjs(),
        json(),
        nodeResolve({
          browser: true,
          extensions,
          preferBuiltins: false,
        }),
        polyfills(),
        filesize(),
        progress(),
        external(),
        esbuild({
          include: /\.[jt]s$/,
          exclude: /node_modules|\.test\.ts$/,
          minify: !_DEV_,
          minifyIdentifiers: false,
          target: 'es2018',
        }),
      ],
    })

    const statsFilePath = path.resolve(outputOptions.dir, 'stats.json')

    const buildResult = await rollup.rollup(rollupConfig)
    if (flags.watch) {
      const watcher = rollup.watch({
        ...rollupConfig,
        watch: {
          exclude: /node_modules/,
        },
      })
      watcher
        .on('change', (id, change) => {
          log.info(`[${u.cyan('change')}] ${u.yellow(id)}`, change)
          switch (
            change.code
            //
          ) {
          }
        })
        .on('event', (evt) => {
          log.info(`[${u.cyan('event')}]`, evt)
        })
        .on('restart', () => {
          log.info(`[${u.cyan('restart')}]`)
        })
        .on('close', () => {
          log.info(`[${u.cyan('close')}]`)
        })

      log.info(
        `[${u.cyan('watching')}] Watching ${u.yellow(
          buildResult.watchFiles.length,
        )} files`,
      )
    } else {
      const writeOutput = await buildResult.write(outputOptions)
      const chunks = writeOutput.output
      const stats = {}

      let numCodeChunks = 0
      let numAssetChunks = 0

      for (const chunk of chunks) {
        const { fileName, name, type } = chunk
        const statsObject = { fileName, name, type }

        if ('code' in chunk) {
          numCodeChunks++
          u.assign(
            statsObject,
            u.pick(chunk, [
              // External modules imported dynamically by the chunk
              'dynamicImports',
              // Exported variable names
              'exports',
              // Entries that should only be loaded after this chunk
              'implicitlyLoadedBefore',
              // Imported bindings per dependency
              'importedBindings',
              // External modules imported statically by the chunk
              'imports',
              'isDynamicEntry',
              'isEntry',
              // Should this chunk only be loaded after other chunks
              'isImplicitEntry',
              // The name of this chunk as used in naming patterns
              'name',
              // Files referenced via import.meta.ROLLUP_FILE_URL_<id>
              'referencedFiles',
              'type',
            ]),
          )
          statsObject.modules = u.entries(chunk.modules || {}).reduce(
            (acc, [filename, obj]) =>
              u.assign(acc, {
                [filename]: u.pick(obj, [
                  // The original length of the code in this module
                  'originalLength',
                  'removedExports',
                  // Exported variable names that were included
                  'renderedExports',
                  // The length of the remaining code in this module
                  'renderedLength',
                ]),
              }),
            {},
          )
        } else {
          numAssetChunks++
          u.assign(statsObject, chunk)
        }

        stats[chunk.name] = statsObject
      }

      log.info(`Total chunks generated: ${u.yellow(chunks.length)}`)
      log.info(`Code chunks: ${u.yellow(numCodeChunks)}`)
      log.info(`Asset chunks: ${u.yellow(numAssetChunks)}`)

      if (flags.stats) {
        log.info(
          `Stats file was generated and save to ${u.yellow(statsFilePath)}`,
        )
        await fs.writeJson(statsFilePath, stats, { spaces: 2 })
      }

      if (flags.types) {
        log.info(`Generating typings...`)
        let cmd = 'tsc '
        cmd += `--allowSyntheticDefaultImports `
        cmd += '--declaration '
        cmd += '--declarationDir '
        cmd += `${outDir} `
        cmd += `--emitDeclarationOnly `
        cmd += `--esModuleInterop `
        cmd += `--lib es2020 `
        cmd += `--lib WebWorker `
        cmd += `--module es2020 `
        cmd += `--moduleResolution node `
        cmd += `--skipLibCheck `
        cmd += `--resolveJsonModule `
        cmd += `--target es2020 `
        cmd += `${inputFile} `
        exec(cmd)
      }
    }

    await buildResult.close()
  } catch (error) {
    throw error instanceof Error ? error : new Error(String(error))
  } finally {
  }
}

module.exports = bundleWebApp
