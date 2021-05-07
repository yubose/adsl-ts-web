const esbuild = require('esbuild')
const fs = require('fs-extra')
const path = require('path')
const ts = require('typescript')
const esbuildPluginTsc = require('esbuild-plugin-tsc')
const minimist = require('minimist')

const srcFilePath = path.join(__dirname, 'src/utils.ts')
const toFilePath = path.join(__dirname, 'dist/utils.js')
const srcCode = fs.readFileSync(srcFilePath, 'utf8')

const program = ts.createProgram({
  rootNames: [],
  projectReferences: [{ path: 'tsconfig.json' }],
  options: {
    allowJs: false,
    allowSyntheticDefaultImports: true,
    declaration: true,
    declarationDir: 'dist',
    emitDeclarationOnly: true,
    outDir: 'dist',
    skipLibCheck: true,
    target: 'es5',
  },
})
// const builder = ts.transpileModule(program, {})
// console.log(program.emit(toFilePath))
// console.log(builder)
console.log(
  program.emit(ts.createSourceFile('utils.ts', srcCode, ts.ScriptTarget)),
)

const args = minimist(process.argv)

const isBuild = !!(args.b || args.build)
const isWatch = !!(args.w || args.watch)
const is = isBuild ? 'build' : 'watch'

console.log(
  JSON.stringify({
    isBuild,
    isWatch,
    defaultingTo: is,
  }),
)

/** @type { import('esbuild').BuildOptions } */

const buildOptions = {
  charset: 'utf8',
  entryPoints: ['./src/utils.ts'],
  outdir: 'dist',
  format: 'cjs',
  sourcemap: 'inline',
  target: ['node12'],
  plugins: [esbuildPluginTsc()],
}

if (isWatch) {
  buildOptions.watch = {
    onRebuild(err, result) {
      if (err) throw err
    },
  }
} else {
  // buildOptions.sourcemap = true
}

// const transformedCode = esbuild.transformSync(
//   fs.readFileSync(path.join(__dirname, 'src/index.ts'), 'utf8'),
//   buildOptions
// )

esbuild.build(buildOptions)
