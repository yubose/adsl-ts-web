const u = require('@jsmanifest/utils')
const y = require('yaml')
const path = require('path')
const del = require('del')
const fs = require('fs-extra')
const webpack = require('webpack')
const singleLog = require('single-line-log').stdout
const CircularDependencyPlugin = require('circular-dependency-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin')
const InjectBodyPlugin = require('inject-body-webpack-plugin').default
const WorkboxPlugin = require('workbox-webpack-plugin')
const InjectScriptsPlugin = require('./scripts/InjectScriptsPlugin')

del.sync(path.resolve(path.join(process.cwd(), 'build')))

const NAME = 'AiTmed'
const TITLE = `${NAME}: Start your E-health Journey Anywhere, Anytime`
const DESCRIPTION = `Anyone, Anywhere, Anytime Start Your E-health Journey With Us`
const KEYWORDS = [
  'accommodate',
  'account',
  'admin',
  'advance',
  'aitmed',
  'appointment',
  'appointments',
  'availability',
  'barriers',
  'best',
  'between',
  'blockchain',
  'breaking',
  'care',
  'choose',
  'chosen',
  'chronic',
  'clinic',
  'cloud',
  'communication',
  'company',
  'complete',
  'compliance',
  'connect',
  'connecting',
  'contact',
  'convenient',
  'coordination',
  'covid19',
  'create',
  'custom',
  'customized',
  'data',
  'date',
  'dates',
  'deliver',
  'dermatology',
  'directly',
  'doctor',
  'doctors',
  'documentation',
  'e-health',
  'e-prescription',
  'e-referral',
  'ecosystem',
  'efficiently',
  'everyone',
  'exchange',
  'facilities',
  'fast',
  'healthcare',
  'high',
  'hipaa',
  'hospital',
  'house',
  'illness',
  'imaging',
  'improve',
  'improving',
  'insurance',
  'knowledge',
  'lab',
  'location',
  'lost',
  'make',
  'manage',
  'management',
  'marketing',
  'matching',
  'maximize',
  'medical',
  'meeting',
  'needs',
  'network',
  'neurology',
  'noodl',
  'online',
  'organizations',
  'pandemic',
  'patient',
  'patient-provider-organization',
  'patient’s',
  'pediatric',
  'people',
  'physician',
  'plan',
  'platform',
  'power',
  'practice',
  'private',
  'professional',
  'profile',
  'program',
  'provider',
  'providers',
  'quality',
  'radiology',
  'reach',
  'referral',
  'reputation',
  'resources',
  'room',
  'schedule',
  'scheduling',
  'search',
  'secure',
  'secures',
  'selected',
  'self',
  'senior',
  'services',
  'share',
  'sign',
  'specialist',
  'support',
  'symptoms',
  'technology',
  'telecommunication',
  'telehealth',
  'telemedicine',
  'tools',
  'top-rated',
  'urgent',
  'virtual',
  'visit',
  'vital',
  'waiting',
  'wellness',
  'works',
  'worldwide',
]
const FAVICON = 'public/favicon.ico'

const pkg = fs.readJsonSync('./package.json')
const nuiPkg = fs.readJsonSync('./packages/noodl-ui/package.json')
const ntypesPkg = fs.readJsonSync('./packages/noodl-types/package.json')
const nutilsPkg = fs.readJsonSync('./packages/noodl-utils/package.json')

const filename = 'index.html'
const publicPath = path.join(process.cwd(), 'public')
const buildPath = path.join(process.cwd(), 'build')

const ECOS_ENV = process.env.ECOS_ENV
const NODE_ENV = process.env.NODE_ENV
const MODE = NODE_ENV !== 'production' ? 'development' : 'production'

let pkgVersionPaths = String(pkg.version).split('.')
let pkgVersionRev = Number(pkgVersionPaths.pop())
let outputFileName = ''
let buildVersion = ''

if (!Number.isNaN(pkgVersionRev)) {
  buildVersion = [...pkgVersionPaths, ++pkgVersionRev].join('.')
  // fs.writeJsonSync(
  //   './package.json',
  //   { ...pkg, version: buildVersion },
  //   { spaces: 2 },
  // )
  outputFileName =
    MODE === 'production' ? `[name].[contenthash].js` : '[name].js'
  // MODE === 'production' ? `[name]${buildVersion}.js` : '[name].js'
} else {
  outputFileName =
    MODE === 'production' ? `[name].[contenthash].js` : '[name].js'
}

const pkgJson = {
  root: pkg,
  nui: nuiPkg,
  nTypes: ntypesPkg,
  nutils: nutilsPkg,
}

const version = {
  noodlSdk:
    pkgJson.root.dependencies['@aitmed/cadl'] ||
    pkgJson.root.devDependencies['@aitmed/cadl'],
  ecosSdk:
    pkgJson.root.dependencies['@aitmed/ecos-lvl2-sdk'] ||
    pkgJson.root.devDependencies['@aitmed/ecos-lvl2-sdk'],
  nui: pkgJson.nui.version,
  nutil: pkgJson.nutils.version,
  nTypes: pkgJson.nTypes.version,
}

const commonHeaders = {
  'Access-Control-Allow-Credentials': true,
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'Origin, X-Requested-With, Content-Type, Accept, Authorization',
}

/**
 * @type { import('webpack').Configuration } webpackOptions
 */
const webpackOptions = {
  entry: {
    main: [process.env.SAMPLE ? './src/sample.ts' : './src/index.ts'],
  },
  output: {
    clean: true,
    // Using content hash when "watching" makes webpack save assets which might increase memory usage
    filename: outputFileName,
    path: buildPath,
  },
  ignoreWarnings: [/InjectManifest/],
  mode: MODE,
  devServer: {
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '127.0.0.1:3000',
      '127.0.0.1:4000',
      'https://127.0.0.1',
      'https://127.0.0.1:3000',
      'https://127.0.0.1:4000',
      'aitmed.com',
      'aitmed.io',
    ],
    compress: false,
    devMiddleware: {
      writeToDisk: true,
    },
    host: '127.0.0.1',
    hot: true,
    liveReload: true,
    headers: commonHeaders,
    port: 3000,
    setupMiddlewares(middlewares, server) {
      server.app.get('/cpt', (req, res) => {
        res.json(y.parse(getShrinkedCptYmlData()))
      })
      return middlewares
    },
    static: [publicPath],
  },
  devtool: false,
  externals: [],
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
        exclude: /\.module\.css$/,
      },
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        include: path.resolve(path.join(process.cwd(), 'src')),
        use: [
          {
            loader: 'esbuild-loader',
            options: { loader: 'ts', target: 'es2017' },
          },
        ],
      },
    ],
  },
  resolve: {
    alias: {
      fs: path.resolve(path.join(process.cwd(), './node_modules/fs-extra')),
    },
    cache: true,
    extensions: ['.ts', '.js'],
    modules: ['node_modules'],
    fallback: {
      assert: false,
      constants: require.resolve('constants-browserify'),
      crypto: require.resolve('crypto-browserify'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      path: require.resolve('path-browserify'),
      process: require.resolve('process/browser'),
      stream: require.resolve('stream-browserify'),
    },
  },
  plugins: [
    new WorkboxPlugin.InjectManifest({
      swSrc: path.join(process.cwd(), './src/firebase-messaging-sw.ts'),
      swDest: 'firebase-messaging-sw.js',
      maximumFileSizeToCacheInBytes: 500000000,
      mode: 'production',
      manifestTransforms: [
        /**
         * @param { WorkboxPlugin.ManifestEntry[] } entries
         * @param { webpack.Compilation } compilation
         * @returns
         */
        (entries) => {
          const mainBundleRegExp = /\.\w{20}\.js$/
          for (const entry of entries) {
            if (entry.url.match(mainBundleRegExp)) {
              // Force the worker to use the url as the revision
              entry.revision = null
            }
          }
          return { manifest: entries, warnings: [] }
        },
      ],
      mode: 'production',
    }),
    new webpack.ProvidePlugin({ process: 'process' }),
    new CircularDependencyPlugin({
      exclude: /node_modules/,
      include: /(src)/,
    }),
    new webpack.ContextReplacementPlugin(
      /date\-fns[\/\\]/,
      new RegExp(`[/\\\\\](${['en-US'].join('|')})[/\\\\\]index\.js$`),
    ),
    new webpack.EnvironmentPlugin({
      BUILD: {
        version: buildVersion,
        ecosEnv: ECOS_ENV,
        nodeEnv: MODE,
        packages: {
          '@aitmed/cadl': version.noodlSdk,
          '@aitmed/ecos-lvl2-sdk': version.ecosSdk,
          'noodl-types': version.nTypes,
          'noodl-ui': version.nui,
          'noodl-utils': version.nutil,
        },
        timestamp: new Date().toLocaleString(),
      },
      // if process.env.DEPLOYING === true, this forces the config url in
      // src/app/noodl.ts to point to the public.aitmed.com host
      ECOS_ENV,
      NODE_ENV: MODE,
      USE_DEV_PATHS: !!process.env.USE_DEV_PATHS,
      ...(!u.isUnd(process.env.DEPLOYING)
        ? {
            DEPLOYING:
              process.env.DEPLOYING === true || process.env.DEPLOYING === 'true'
                ? true
                : false,
          }
        : undefined),
    }),
    new HtmlWebpackPlugin({
      alwaysWriteToDisk: true,
      filename,
      title: TITLE,
      favicon: FAVICON,
      cache: true,
      scriptLoading: 'defer',
      minify: true,
      meta: {
        description: DESCRIPTION,
        keywords: KEYWORDS.join(', '),
        viewport:
          'width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no',
      },
    }),
    new HtmlWebpackHarddiskPlugin(),
    new InjectScriptsPlugin({ path: 'public/libs.html' }),
    new InjectBodyPlugin({
      content: `<div id="root"></div>`,
      position: 'start',
    }),
    new CopyPlugin({
      patterns: [
        {
          from: 'public/piBackgroundWorker.js',
          to: 'piBackgroundWorker.js',
        },
        // {
        //   from: 'public/worker.js',
        //   to: 'worker.js',
        // },
        {
          from: 'public/jsstoreWorker.min.js',
          to: 'jsstoreWorker.min.js',
        },
        { from: 'public/sql-wasm.wasm', to: 'sql-wasm.wasm' },
      ],
    }),
    new webpack.ProgressPlugin({
      handler: webpackProgress,
    }),
  ],
  optimization:
    MODE === 'production'
      ? {
          concatenateModules: true,
          mergeDuplicateChunks: true,
          minimize: true,
          nodeEnv: 'production',
          removeEmptyChunks: true,
          splitChunks: {
            // chunks(chunk) {
            //   // console.log(`[${u.cyan('chunk')}]`, chunk)
            //   return true
            // },
            chunks: 'async',
            minSize: 35000,
            maxSize: 80000,
            minChunks: 8,
            maxAsyncRequests: 30,
            maxInitialRequests: 30,
            automaticNameDelimiter: '~',
            enforceSizeThreshold: 50000,
            cacheGroups: {
              defaultVendors: {
                test: /[\\/]node_modules[\\/]/,
                priority: -10,
              },
              default: {
                minChunks: 5,
                priority: -20,
                reuseExistingChunk: true,
              },
            },
          },
        }
      : undefined,
}

const getEcosEnv = () =>
  ECOS_ENV ? ECOS_ENV.toUpperCase() : '<Variable not set>'

const getNodeEnv = () => (MODE ? MODE.toUpperCase() : '<Variable not set>')

/**
 * @param { number } percentage
 * @param { string } msg
 * @param { ...string } args
 */
function webpackProgress(percentage, msg, ...args) {
  process.stdout.write('\x1Bc')
  // prettier-ignore
  singleLog(
  `Your app is being built for ${u.cyan(`eCOS`)} ${u.magenta(getEcosEnv())} environment in ${u.cyan(getNodeEnv())} MODE\n
  Version:   ${u.cyan(buildVersion)}
  Status:    ${u.cyan(msg.toUpperCase())}
  File:      ${u.magenta(args[0])}
  Progress:  ${u.magenta(percentage.toFixed(4) * 100)}%

  ${u.cyan('eCOS packages')}:
  ${u.white(`@aitmed/cadl`)}:            ${u.magenta(version.noodlSdk)}
  ${u.white(`@aitmed/ecos-lvl2-sdk`)}:   ${u.magenta(version.ecosSdk)}
  ${u.white(`noodl-types`)}:             ${u.magenta(version.nTypes)}
  ${u.white(`noodl-ui`)}:                ${u.magenta(version.nui)}
  ${u.white(`noodl-utils`)}:             ${u.magenta(version.nutil)}
  ${MODE === 'production'
      ? `\nAn ${u.magenta(filename)} file will be generated inside your ${u.magenta('build')} directory. \nThe title of the page was set to ${u.yellow(TITLE)}`
      : ''
  }\n\n`)
}

module.exports.NAME = NAME
module.exports.TITLE = TITLE
module.exports.DESCRIPTION = DESCRIPTION
module.exports.KEYWORDS = KEYWORDS
/** @type { import('webpack').Configuration[] } */
module.exports = [
  {
    entry: {
      main: {
        import: path.join(__dirname, 'src/piBackgroundWorker.ts'),
        filename: 'piBackgroundWorker.js',
      },
    },
    output: {
      clean: true,
      filename: '[name].js',
      path: publicPath,
    },
    devtool: 'source-map',
    mode: 'development',
    module: {
      rules: [
        {
          test: /\.(js|ts)?$/,
          exclude: /node_modules/,
          include: path.join(__dirname),
          use: [
            {
              loader: 'esbuild-loader',
              options: { loader: 'ts', target: 'es2017', sourcemap: 'inline' },
            },
          ],
        },
      ],
    },
    resolve: {
      extensions: ['.js', '.ts'],
    },
  },
  webpackOptions,
]

function getShrinkedCptYmlData() {
  return `CPT:
  version: 1.0.3
  content:
    '99509':
        >-
          A home health provider, such as a registered nurse, or a non nursing
          practitioner, visits a patient to provide help with activities of daily
          living, or ADLs, and self care.
    '99510':
        >-
          A licensed psychologist or social worker visits the patient in his home
          to provide counseling.
    '99511':
        >-
          The provider visits a patient at home to manage treatment for and remove
          the patient’s fecal impaction.
    '99512':
        >-
          The provider visits the patient at home to provide hemodialysis, which
          removes waste from the blood in a patient with kidney failure.
    '99600':
        >-
          Use 99600 to report a home visit service or procedure that does not have
          a specific code.
    '99601':
        >-
          The provider visits the patient at home to provide an infusion or
          administer a specialty drug. Use this code for up to the first two hours
          of a visit.
    '99602':
        >-
          The provider visits the patient at home to provide an infusion or
          administer a specialty drug. Use this code for each additional hour of
          the visit after the first two hours.
    '99605':
        >-
          The pharmacist provides a 15–minute, in–person, patient–specific
          medication evaluation for a new patient based on factors such as the
          patient’s history and medication list.
    '99606':
        >-
          The pharmacist provides a 15–minute, in–person, patient–specific
          medication evaluation for an established patient based on factors such
          as the patient’s history and medication list.
    '99607':
        >-
          After an initial 15 minutes, the pharmacist provides an additional
          15–minutes of an in–person, patient–specific medication evaluation for a
          patient based on factors such as the patient’s history and medication
          list.
    0042T:
        >-
          The provider obtains a measurement of regional cerebral blood flow
          through analysis of computed tomography (CT) scans by taking sequential
          images of sections of the brain while administering intravenous
          contrast. This procedure is done to evaluate patients suspected of
          having a stroke.
    0054T:
        >-
          The provider uses a computer equipped with surgical navigation
          technology to help guide and validate the type and position of an
          orthopedic implant using fluoroscopy. A provider uses this service most
          often to assist with accurate placement and positioning of the implant
          prosthesis in reconstruction or replacement of a knee or hip.
    0055T:
        >-
          The provider uses a computer equipped with surgical navigation
          technology to help guide and validate the type and position of an
          orthopedic implant using computed tomography, or CT, or magnetic
          resonance imaging, or MRI. A provider uses this service most often to
          assist with accurate placement and positioning of the implant prosthesis
          in reconstruction or replacement of a knee or hip.
    0072T:
        >-
          The provider uses magnetic resonance imaging guided focused ultrasound,
          or MRgFUS, to heat and destroy a noncancerous growth of the uterus,
          called a leiomyomata, whose total volume is 200 cc of tissue or greater.
          The procedure is done with a patient inside a magnetic resonance imaging
          scanner, which monitors temperature and guides the provider to the
          precise location of the leiomyomata, or uterine fibroids.
    0075T:
        >-
          In this procedure, the provider places a stent through an incision in
          the skin into a vessel of the extracranial vertebral artery, to treat a
          stenosis or blockage. This code includes imaging for determination of
          the need for stenting along with radiological supervision and
          interpretation of same.
    0071T:
        >-
          The provider uses magnetic resonance imaging guided focused ultrasound, or MRgFUS, to heat and destroy a noncancerous growth of the uterus, called a leiomyomata, whose total volume is not greater than 200 cc of tissue. \_The procedure is done with a patient inside a magnetic resonance imaging scanner, which monitors temperature and guides the provider to the precise location of the leiomyomata, or uterine fibroids.
    0076T:
        >-
          In this procedure, at the same time as placement of an initial stent,
          the provider places an additional stent through an incision in the skin
          into an additional vessel of the extracranial vertebral artery to treat
          stenosis or blockage. This procedure includes imaging to determine the
          need for stent placement along with radiologic supervision and
          interpretation.
    '10040':
        >-
          The provider may extract the contents of an acne lesion with a
          suction–type instrument or excise or perform marsupialization on larger
          lesions or cysts.
    '10140':
        >-
          The provider makes an incision into the hematoma, seroma, or other
          collection of fluid and bluntly penetrates it to allow fluid evacuation.
    '10081':
        >-
          The provider opens (incises) and drains the contents of a pilonidal
          cyst, a nest of hair and debris that forms at the base of the spine; the
          procedure requires extra time and technique to perform.
    '10080':
        >-
          The provider open (incises) and drains the contents of a pilonidal cyst.
    '10120':
        >-
          The provider removes a foreign body such as a thorn, piece of wood,
          sliver of glass or fishook, from the lower layer of skin.
    '10061':
        >-
          The provider incises the area of abscess and drains the collection of
          pus, such as those related to a carbuncle, hidradenitis, cyst, furuncle,
          or paronychia, with the help of surgical instruments. A complicated
          incision and drainage can involve multiple incisions, drain placements,
          extensive packing, and a more complicated wound closure.
    '10060':
        >-
          The provider incises the area of abscess and drains the collection of
          pus from a lesion, such as a carbuncle, hidradenitis, cyst, furuncle, or
          paronychia, with the help of surgical instruments. A simple incision and
          drainage usually involves a single incision of an abscess situated just
          below the skin's surface.
    '10121':
        >-
          The provider removes a foreign body such as a thorn, piece of wood,
          sliver of glass or fishook, from the lower layer of skin; the incision
          and removal may be complicated by the need for extensive dissection,
          imaging guidance, or layered closure.
    '10021':
        >-
          The provider performs a fine needle aspiration (FNA), a diagnostic
          procedure that involves collecting a small number of cells, a small
          amount of tissue, or fluid from a cyst or mass using a specialized
          needle and syringe. Report this code for the first lesion biopsied.
    '11004':
        >-
          The provider evaluates the extent of necrotic tissue in external
          genitalia and the perineum, and debrides the infected necrotic skin,
          subcutaneous tissue, muscle, and fascia.
    '11006':
        >-
          The provider evaluates the extent of necrotic tissue in the external
          genitalia, perineum, and abdominal wall and debrides the infected
          necrotic skin, subcutaneous tissue, muscle and fascia.
    '10180':
        >-
          The provider incises the area of infection and drains any fluid
          collection, with the help of surgical instruments; the procedure may be
          complicated requiring more time and more extensive technique.
    '11001':
        >-
          In this add–on procedure, the provider uses surgical instruments to
          debride the dead tissue from up to an additional 10 percent of skin
          after debriding the initial 10 percent at the same encounter.
    '10160':
        >-
          The provider inserts a needle into a fluid deposit area on the skin and
          aspirates fluid or pus to obtain a culture.
    '11005':
        >-
          The provider evaluates the extent of necrotic tissue in the abdominal
          wall and debrides the infected necrotic skin, subcutaneous tissue,
          muscle, and fascia.
    '11000':
        >-
          The provider uses surgical instruments to debride the dead tissue in
          skin for up to 10 percent of the body surface.
    '11010':
        >-
          The provider removes necrotic tissue along with\_all foreign materials from skin and subcutaneous tissues in and around the site of an open fracture or dislocation.
    '11008':
        >-
          The provider uses surgical instruments to remove prosthetic materials or
          mesh from the abdominal wall as part of treating an infection. He
          performs this service at the same session as a separately reportable
          debridement or incision and drainage procedure.
    '11011':
        >-
          The provider removes necrotic tissue along with all foreign materials
          from skin, subcutaneous tissues, muscle fascia, and muscle in and around
          the site of an open fracture and/or open dislocation.
    '11042':
        >-
          The provider uses surgical instruments to remove the dead tissue in skin
          down to the subcutaneous layer and including the epidermis and dermis,
          up to the first 20 cm2.
    '11043':
        >-
          The provider uses surgical instruments to remove the dead tissue in
          muscle and/or fascia, including any debridement of the epidermis,
          dermis, and subcutaneous tissue, for the first or only 20 cm2 or less.
    '11012':
        >-
          The provider removes necrotic tissue along with all foreign materials
          from skin, subcutaneous tissue, muscle fascia, muscle, and bone in and
          around the site of an open fracture and/or open dislocation.
    '11056':
        >-
          The provider removes 2 to 4 benign hyperkeratotic lesions by using
          surgical instruments like a scalpel or curette.
    '11307':
        >-
          The provider shaves off a single epidermal or dermal lesion 1.1 to 2.0
          cm in diameter from the skin of the scalp, neck, hands, feet, or
          genitals.
    '11303':
        >-
          The provider shaves off a single epidermal or dermal lesion greater than
          2.0 cm in diameter from the skin of the trunk, arms, or legs.
    '11055':
        >-
          The provider removes a single benign hyperkeratotic lesion by using
          surgical instruments like a scalpel or curette.
    '11302':
        >-
          The provider shaves off a single epidermal or dermal lesion of 1.1 to
          2.0 cm in diameter from the skin of the trunk, arms, or legs.
    '11057':
        >-
          The provider removes more than 4 benign hyperkeratotic lesions by using
          surgical instruments like a scalpel or curette.
    '11301':
        >-
          The provider shaves off a single epidermal or dermal lesion of 0.6 to
          1.0 cm in diameter from the skin of the trunk, arms, or legs.
    '11306':
        >-
          The provider shaves off a single epidermal or dermal lesion of 0.6 to
          1.0 cm in diameter from the skin of the scalp, neck, hands, feet, or
          genitals.
    '11044':
        >-
          The provider uses surgical instruments to remove the dead, infected
          tissue in bone, also including the epidermis, dermis, subcutaneous
          tissue, muscle, and/or fascia as needed. This code covers the first or
          only 20 cm2 or less.
    '11305':
        >-
          The provider shaves off a single epidermal or dermal lesion of 0.5 cm or
          less in diameter from the scalp, neck, hands, feet, or genitals.
    '11300':
        >-
          The provider removes one epidermal or dermal lesion of 0.5 cm diameter
          or less from the trunk, arms, or legs.
    '11200':
        >-
          The provider removes skin tags in any area of the body, up to and
          including 15 lesions.
    '11201':
        >-
          The provider removes up to 10 additional skin tags in any area of the
          body, after removing an initial 15 lesions.
    '11400':
        >-
          The provider excises a noncancerous lesion, excluding a skin tag, of 0.5
          cm or less in diameter, including margins, from the skin of the trunk,
          arms, or legs.
    '11310':
        >-
          The provider shaves off a single epidermal or dermal lesion of 0.5 cm or
          less in diameter from the face, ears, eyelids, nose, lips, or mucous
          membranes.
    '11404':
        >-
          The provider excises a noncancerous lesion, excluding a skin tag, of 3.1
          to 4.0 cm in diameter, including margins, from the skin of the trunk,
          arms, or legs.
    '11422':
        >-
          The provider excises a noncancerous lesion, excluding a skin tag, of 1.1
          to 2.0 cm in diameter, including margins, from the skin of the scalp,
          neck, hands, feet, or genitals.
    '11420':
        >-
          The provider excises a noncancerous lesion, excluding a skin tag, of 0.5
          cm or less in diameter, including margins, from the skin of the scalp,
          neck, hands, feet, or genitals.
    '11423':
        >-
          The provider excises a noncancerous lesion, excluding a skin tag, of 2.1
          to 3.0 cm in diameter, including margins, from the skin of the scalp,
          neck, hands, feet, or genitals.
    '11402':
        >-
          The provider excises a noncancerous lesion, excluding a skin tag, of 1.1
          to 2.0 cm in diameter, including margins, from the skin of the trunk,
          arms, or legs.
    '11312':
        >-
          The provider shaves off a single epidermal or dermal lesion of 1.1 to
          2.0 cm in diameter from the face, ears, eyelids, nose, lips, or mucous
          membranes.
    '11401':
        >-
          The provider excises a noncancerous lesion, excluding a skin tag, of 0.6
          to 1.0 cm in diameter, including margins, from the skin of the trunk,
          arms, or legs.
    '11403':
        >-
          The provider excises a noncancerous lesion, excluding a skin tag, of 2.1
          to 3.0 cm in diameter, including margins, from the skin of the trunk,
          arms, or legs.
    '11406':
        >-
          The provider excises a noncancerous lesion, excluding a skin tag, of
          greater than 4.0 cm in diameter, including margins, from the skin of the
          trunk, arms, or legs.
    '11421':
        >-
          The provider excises a noncancerous lesion, excluding a skin tag, of 0.6
          to 1.0 cm in diameter, including margins, from the skin of the scalp,
          neck, hands, feet, or genitals.
    '11313':
        >-
          The provider shaves off a single epidermal or dermal lesion of 2.0 cm or
          greater in diameter from the face, ears, eyelids, nose, lips, or mucous
          membranes.
    '11311':
        >-
          The provider shaves off a single epidermal or dermal lesion of 0.6 to
          1.0 cm in diameter from the face, ears, eyelids, nose, lips, or mucous
          membranes.
    '11308':
        >-
          The provider shaves off a single epidermal or dermal lesion greater than
          2.0 cm in diameter from the skin of the scalp, neck, hands, feet, or
          genitals.
    '11440':
        >-
          The provider excises a benign (noncancerous) lesion including margins from the face, ears, eyelids, nose, lips, or mucous membrane that is 0.5 cm in diameter or less\_and also performs a simple (nonlayered) closure.
    '11441':
        >-
          The provider excises a benign (noncancerous) lesion including margins from the face, ears, eyelids, nose, lips, or mucous membrane that is\_0.6 to 1.0 cm in diameter and also performs a simple (nonlayered) closure.
    '11463':
        >-
          The provider excises inguinal skin and subcutaneous tissue involved with
          hidradenitis (painful lesions associated with sweat glands); he closes
          the excision site using complex repair techniques.
    '11443':
        >-
          The provider excises a benign (noncancerous) lesion including margins from the face, ears, eyelids, nose, lips, or mucous membrane that is 2.1 to 3.0 cm in diameter or less\_and also performs a simple (nonlayered) closure.
    '11470':
        >-
          The provider excises perianal, perineal, or umbilical skin and
          subcutaneous tissue involved with hidradenitis (painful lesions
          associated with sweat glands); he closes the excision site using simple
          or intermediate repair techniques.
    '11444':
        >-
          The provider excises a benign (noncancerous) lesion including margins from the face, ears, eyelids, nose, lips, or mucous membrane that is 3.1 to 4.0 cm in diameter or less\_and also performs a simple (nonlayered) closure.
    '11462':
        >-
          The provider excises inguinal skin and subcutaneous tissue involved with
          hidradenitis (painful lesions associated with sweat glands); he closes
          the excision site using simple or intermediate repair techniques.
    '11442':
        >-
          The provider excises a benign (noncancerous) lesion including margins
          from the face, ears, eyelids, nose, lips, or mucous membrane that is 1.1
          to 2.0 cm in diameter and also performs a simple (nonlayered) closure.
    '11426':
        >-
          The provider excises a noncancerous lesion, excluding a skin tag,
          greater than 4.0 cm in diameter, including margins, from the skin of the
          scalp, neck, hands, feet, or genitals.
    '11424':
        >-
          The provider excises a noncancerous lesion, excluding a skin tag, of 3.1
          to 4.0 cm in diameter, including margins, from the skin of the scalp,
          neck, hands, feet, or genitals.
    '11450':
        >-
          The provider excises axillary skin and subcutaneous tissue involved with
          hidradenitis (painful lesions associated with sweat glands); he closes
          the excision site using simple or intermediate repair techniques.
    '11471':
        >-
          The provider excises perianal, perineal, or umbilical skin and
          subcutaneous tissue involved with hidradenitis (painful lesions
          associated with sweat glands); he closes the excision site using complex
          repair techniques.
    '11600':
        >-
          The provider excises a cancerous (malignant) lesion, including margins,
          of 0.5 cm or less in diameter, from the skin of the trunk, arms, or
          legs.
    '11451':
        >-
          The provider excises axillary skin and subcutaneous tissue involved with
          hidradenitis (painful lesions associated with sweat glands); he closes
          the excision site using complex repair techniques.
    '11446':
        >-
          The provider excises a benign (noncancerous) lesion including margins
          from the face, ears, eyelids, nose, lips, or mucous membrane that is
          over 4.0 cm in diameter and also performs a simple (nonlayered) closure.
    '11643':
        >-
          The provider excises a cancerous (malignant) lesion, including margins, of 2.1 to 3.0 cm in diameter, from the skin of the\_face, ears, eyelids, nose, lips.
    '11620':
        >-
          The provider excises a cancerous (malignant) lesion, including margins,
          of 0.5 cm or less in diameter, from the skin of the scalp, neck, hands,
          feet, or genitalia (sex organs).
    '11641':
        >-
          The provider excises a cancerous (malignant) lesion, including margins, of 0.6 to 1.0 cm in diameter, from the skin of the\_face, ears, eyelids, nose, lips.
    '11601':
        >-
          The provider excises a cancerous (malignant) lesion, including margins,
          of 0.6 to 1.0 cm or less in diameter, from the skin of the trunk, arms,
          or legs.
    '11621':
        >-
          The provider excises a cancerous (malignant) lesion, including margins,
          of 0.6 to 1.0 cm or less in diameter, from the skin of the scalp, neck,
          hands, feet, or genitalia (sex organs).
    '11622':
        >-
          The provider excises a cancerous (malignant) lesion, including margins,
          of 1.1 to 2.0 cm in diameter, from the skin of the scalp, neck, hands,
          feet, or genitalia (sex organs).
    '11623':
        >-
          The provider excises a cancerous (malignant) lesion, including margins,
          of 2.1 to 3.0 cm in diameter, from the skin of the scalp, neck, hands,
          feet, or genitalia (sex organs).
    '11626':
        >-
          The provider excises a cancerous (malignant) lesion, including margins,
          of over 4.0 cm in diameter, from the skin of the scalp, neck, hands,
          feet, or genitalia (sex organs).
    '11603':
        >-
          The provider excises a cancerous (malignant) lesion, including margins,
          of 2.1 to 3.0 cm in diameter, from the skin of the trunk, arms, or legs.
    '11606':
        >-
          The provider excises a cancerous (malignant) lesion, including margins,
          over 4.0 cm in diameter, from the skin of the trunk, arms, or legs.
    '11604':
        >-
          The provider excises a cancerous (malignant) lesion, including margins,
          of 3.1 to 4.0 cm in diameter, from the skin of the trunk, arms, or legs.
    '11640':
        >-
          The provider excises a cancerous (malignant) lesion, including margins, of 0.5 cm or less in diameter, from the skin of the\_face, ears, eyelids, nose, lips.
    '11624':
        >-
          The provider excises a cancerous (malignant) lesion, including margins,
          of 3.1 to 4.0 cm in diameter, from the skin of the scalp, neck, hands,
          feet, or genitalia (sex organs).
    '11602':
        >-
          The provider excises a cancerous (malignant) lesion, including margins,
          of 1.1 to 2.0 cm in diameter, from the skin of the trunk, arms, or legs.
    '11642':
        >-
          The provider excises a cancerous (malignant) lesion, including margins, of 1.1 to 2.0 cm in diameter, from the skin of the\_face, ears, eyelids, nose, lips.
    '11646':
        >-
          The provider excises a cancerous (malignant) lesion, including margins, over 4.0 cm in diameter, from the skin of the\_face, ears, eyelids, nose, lips.
    '11732':
        >-
          The provider removes part or all of an additional nail plate after the
          first using simple avulsion techniques.
    '11730':
        >-
          The provider removes part or all of a single nail plate\_using simple avulsion techniques.
    '11719':
        >-
          The provider performs trimming of one or more normally developed nails
          of the fingers or toes.
    '11740':
        >-
          Use CPT code 11740 if the physician 'evacuates a nail hematoma,' which
          is another way of saying that he or she drained blood from under the
          nail.
    '11760':
        >-
          The nail bed can be injured due to laceration, crush, or avulsion. \_This procedure is performed to repair such damage.
    '11721':
        >-
          The provider surgically\_debrides (debulks or removes) 6 or more abnormal, diseased, or infected nails.
    '11750':
        >-
          The provider removes part or all of a fingernail or toenail, including
          the nail plate and matrix and including the lunula if the excision is
          complete.
    '11644':
        >-
          The provider excises a cancerous (malignant) lesion, including margins, of 3.1 to 4.0 cm in diameter, from the skin of the\_face, ears, eyelids, nose, lips.
    '11755':
        >-
          This procedural code is used when the physician biopsies the nail plate, bed,\_hyponychium, proximal nail folds, or lateral nail folds. \_Each one is a separate procedure.
    '11765':
        >-
          The provider performs a wedge excision of the skin of the nail fold at
          the lateral margin (groove) of a nail, such as an ingrown toenail.
    '11720':
        >-
          The provider surgically debrides (debulks or removes) 1 to 5 abnormal,
          diseased, or infected nails.
    '11770':
        >-
          The provider excises a pilonidal cyst or sinus not requiring extensive
          dissection and without complication.
    '11762':
        >-
          The nail bed can be injured due to laceration, crush, or avulsion. The
          provider repairs the damage using a graft.
    '11971':
        >-
          The provider removes a tissue expander without inserting an implant.
    '11952':
        >-
          The provider injects 5.1 cc to 10.0 cc of collagen into the subcutaneous
          layer of skin.
    '11954':
        >-
          The provider injects more than 10.0 cc of collagen into the subcutaneous
          layer of skin.
    '11951':
        >-
          The provider injects 1.1 cc to 5.0 cc of collagen into the subcutaneous
          layer of skin.
    '11901':
        >-
          This code describes an intralesional injection of a corticosteroid, such
          as triamcinolone acetonide, for treatment of large nodules, keloids,
          lichenified hyperkeratotic lesions, and numerous other conditions.
    '11771':
        >-
          The provider excises a pilonidal cyst or sinus that requires extensive
          dissection into deeper subcutaneous tissues.
    '11900':
        >-
          This code describes an intralesional injection of a corticosteroid, such
          as triamcinolone acetonide, for treatment of large nodules, keloids,
          lichenified hyperkeratotic lesions, and numerous other conditions.
    '11960':
        >-
          The provider inserts one or more implants under the patient’s skin that
          helps to expand the tissues. This code represents placement of expanders
          anywhere in the patient’s body, except the breast, for reconstruction of
          tissue defects.
    '11772':
        >-
          The provider excises a pilonidal cyst or sinus requiring extensive
          dissection and without complication.
    '11950':
        >-
          The provider injects 1 cc or less of collagen into the subcutaneous
          tissue.
    '11920':
        >-
          The provider tattoos an area of skin measuring 6.0 cm2 in size or less using intradermal insoluble opaque pigments\_to correct skin color defects, which happen because of congenital defects, breast reconstruction, burns, vitiligo, birthmarks, and other such conditions. The procedure provides a 'permanent camouflage' for the defect.
    '11922':
        >-
          The provider tattoos an area of skin using intradermal insoluble opaque pigments\_to correct skin color defects, which happen because of congenital defects, breast reconstruction, burns, vitiligo, birthmarks, and other such conditions. The procedure provides a 'permanent camouflage' for the defect. This code represents each additional 20.0 cm2, or part thereof, after the first 20.0 cm2.
    '11921':
        >-
          The provider tattoos an area of skin measuring 6.1 to 20.0 cm2 in size using intradermal insoluble opaque pigments\_to correct skin color defects, which happen because of congenital defects, breast reconstruction, burns, vitiligo, birthmarks, and other such conditions. The procedure provides a 'permanent camouflage' for the defect.
    '11970':
        >-
          The provider fits a permanent implant in the patient’s body in place of
          a previously placed tissue expander.
    '11976':
        >-
          Contraceptive capsules (e.g. Levonorgestrel) are inserted subdermally, under the patient's arm skin. \_These capsules then release levels of synthetic hormones to prevent pregnancy. \_These capsules eventually release all of their synthetic hormone and have to be removed and/or replaced if the patient chooses.
          This CPT code is used for the removal of implantable contraceptive
          capsules that have been previously implanted under the skin of the
          patient's arms and now need to be removed.
    '12005':
        >-
          This CPT code is used for the simple repair of superficial wounds to the
          scalp, neck, axillae, external genitalia, trunk, and/or extremities
          (including the hands and feet) that are 12.6 to 20 cm in size.
    '11980':
        >-
          The provider inserts hormone pellets subdermally, normally under the patient's arm skin. \_These pellets then release levels of synthetic hormones (testosterone and/or estradiol) to treat menopausal symptoms in women or testosterone deficiency in males.
    '12011':
        >-
          This CPT code is used for the simple repair of superficial wounds to the
          face, ears, eyelids, nose, lips, and/or mucous membranes, that are 2.5
          cm or less in size.
    '12007':
        >-
          This CPT code is used for the simple repair of superficial wounds to the
          scalp, neck, axillae, external genitalia, trunk, and/or extremities
          (including the hands and feet) that are over 30.0 cm in size or more.
    '12004':
        >-
          This CPT code is used for the simple repair of superficial wounds to the
          scalp, neck, axillae, external genitalia, trunk, and/or extremities
          (including the hands and feet) that are 7.6 to 12.5 cm in size.
    '11982':
        >-
          The provider removes a non–biodegradable implant (a capsule or pellet
          with controlled–release properties containing a drug for long term
          delivery).
    '12002':
        >-
          This CPT code is used for the simple repair of superficial wounds to the
          scalp, neck, axillae, external genitalia, trunk, and/or extremities
          (including the hands and feet) that are 2.6 to 7.5 cm in size.
    '12014':
        >-
          This CPT code is used for the simple repair of superficial wounds to the
          face, ears, eyelids, nose, lips, and/or mucous membranes, that are 5.1
          t0 7.5 cm in size.
    '11981':
        >-
          The provider inserts a\_bioresorbable, biodegradable, or\_non–biodegradable implant, such as\_a capsule or pellet,\_containing a drug for long–term delivery.
    '11983':
        >-
          The provider removes a non–biodegradable implant (a capsule or pellet
          with controlled–release properties containing a drug for long term
          delivery) after which he inserts a new one.
    '12001':
        >-
          This CPT code is used for the simple repair of superficial wounds to the
          scalp, neck, axillae, external genitalia, trunk, and/or extremities
          (including the hands and feet) that are 2.5 cm or less in size.
    '12013':
        >-
          This CPT code is used for the simple repair of superficial wounds to the
          face, ears, eyelids, nose, lips and/or mucous membranes, that are 2.6 to
          5.0 cm in size.
    '12006':
        >-
          This CPT code is used for the simple repair of superficial wounds to the
          scalp, neck, axillae, external genitalia, trunk, and/or extremities
          (including the hands and feet) that are 20.1 to 30 cm in size.
    '12016':
        >-
          This CPT code is used for the simple repair of superficial wounds to the
          face, ears, eyelids, nose, lips, and/or mucous membranes, that are 12.6
          to 20 cm in size.
    '12035':
        >-
          This CPT® code is used for the intermediate repair of wounds to the
          scalp, axillae, trunk, and/or extremities (excluding hands and feet)
          that are 12.6 to 20 cm in size.
    '12021':
        >-
          Wound dehiscence usually describes opening up of a previously sutured
          area that has become infected. In this procedure, the provider treats a
          superficial wound dehiscence with packing.
    '12031':
        >-
          This CPT® code is used for the intermediate repair of wounds to the
          scalp, axillae, trunk, and/or extremities (excluding hands and feet)
          that are 2.5 cm or less in size.
    '12037':
        >-
          This CPT® code is used for the intermediate repair of wounds to the
          scalp, axillae, trunk, and/or extremities (excluding hands and feet)
          that are over 30.0 cm or greater in size.
    '12020':
        >-
          Wound dehiscence usually describes opening up a previously sutured area
          that has become infected. The provider cleans the wound and closes it
          with a simple closure.
    '12015':
        >-
          This CPT code is used for the simple repair of superficial wounds to the
          face, ears, eyelids, nose, lips, and/or mucous membranes, that are 7.6
          to 12.5 cm in size.
    '12036':
        >-
          This CPT® code is used for the intermediate repair of wounds to the
          scalp, axillae, trunk, and/or extremities (excluding hands and feet)
          that are 20.1 to 30 cm in size.
    '12032':
        >-
          This CPT® code is used for the intermediate repair of wounds to the
          scalp, axillae, trunk and/or extremities (excluding hands and feet) that
          are 2.6 to 7.5 cm in size.
    '12044':
        >-
          This CPT® code is used for the intermediate repair of superficial wounds
          to the neck, hands, feet, and/or external genitalia that are 7.6 to 12.5
          cm in size.
    '12041':
        >-
          This CPT® code is used for the intermediate repair of superficial wounds
          to the neck, hands, feet and/or external genitalia that are 2.5 cm or
          less in size.
    '12018':
        >-
          This CPT code is used for the simple repair of superficial wounds to the
          face, ears, eyelids, nose, lips and/or mucous membranes, that are more
          than 30.0 cm or greater in size.
    '12042':
        >-
          This CPT® code is used for the intermediate repair of superficial wounds
          to the neck, hands, feet, and/or external genitalia that are 2.6 to 7.5
          cm in size.
    '12034':
        >-
          This CPT® code is used for the intermediate repair of wounds to the
          scalp, axillae, trunk and/or extremities (excluding hands and feet) that
          are 7.6 to 12.5 cm in size.
    '12017':
        >-
          This CPT code is used for the simple repair of superficial wounds to the
          face, ears, eyelids, nose, lips and/or mucous membranes that are 20.1 to
          30 cm in size.
    '12047':
        >-
          This CPT® code is used for the intermediate repair of superficial wounds
          to the neck, hands, feet and/or external genitalia that are over 30.0 cm
          or greater in size.
    '13121':
        >-
          This is for a complex repair of a wound to the scalp, arms, and/or legs. \_This wound should be 2.6 to 7.5 cm in size.
    '12052':
        >-
          This CPT® code is used for the intermediate repair of wounds to the
          face, ears, eyelids, nose, lips and/or mucous membranes that are 2.6 to
          5.0 cm in size.
    '13102':
        >-
          This is for a complex repair of each additional 5 cm or less of a wound to the trunk. \_ This CPT code is listed separately in addition to the code for the primary procedure and covers additional wounds.
    '13100':
        >-
          This is for a complex repair of a wound to the trunk. \_This wound should be 1.1 to 2.5 cm in size.
    '12046':
        >-
          This CPT® code is used for the intermediate repair of superficial wounds
          to the neck, hands, feet and/or external genitalia that are 20.1 to 30
          cm in size.
    '13120':
        >-
          This is for a complex repair of a wound 1.1 to 2.5 cm in size on the
          scalp, arms, and/or legs.
    '12054':
        >-
          This CPT® code is used for the intermediate repair of wounds to the
          face, ears, eyelids, nose, lips, and/or mucous membranes that are 7.6 to
          12.5 cm in size.
    '12045':
        >-
          This CPT® code is used for the intermediate repair of superficial wounds
          to the neck, hands, feet and/or external genitalia that are 12.6 to 20
          cm in size.
    '12056':
        >-
          This CPT® code is used for the intermediate repair of wounds to the
          face, ears, eyelids, nose, lips and/or mucous membranes that are 20.1 to
          30 cm in size.
    '13101':
        >-
          This is for a complex repair of a wound to the trunk. \_This wound should be 2.6 to 7.5 cm in size.
    '12053':
        >-
          This CPT® code is used for the intermediate repair of wounds to the
          face, ears, eyelids, nose, lips, and/or mucous membranes that are 5.1 to
          7.5 cm in size.
    '12051':
        >-
          This CPT® code is used for the intermediate repair of wounds to the
          face, ears, eyelids, nose, lips, and/or mucous membranes that are 2.5 cm
          or less in size.
    '12055':
        >-
          This CPT® code is used for the intermediate repair of wounds to the
          face, ears, eyelids, nose, lips and/or mucous membranes that are 12.6 to
          20 cm in size.
    '12057':
        >-
          This CPT® code is used for the intermediate repair of wounds to the
          face, ears, eyelids, nose, lips and/or mucous membranes that are over
          30.0 cm or greater in size.
    '14041':
        >-
          The provider replaces the lesions in the forehead, cheeks, chin, mouth,
          neck, axillae or armpits, genitalia, hands, or feet with the healthy
          tissues from an adjacent site. This code represents a defect of 10.1 cm2
          to 30.0 cm2.
    '13152':
        >-
          The physician performs closure of a wound/laceration for at least one of
          the following anatomic areas: eyelids, nose, ears, lips. The repair
          performed is of a complex nature, which involves more than a layered
          type closure. Total length or wound diameter repaired in a complex
          manner must be from 2.6 cm to 7.5 cm.
    '13122':
        >-
          This is for a complex repair of a wound to the scalp, arms, and/or legs.
          This code is for each additional 5 cm or less, in addition to the
          primary wound. This CPT code is listed separately to denote an
          additional procedure to the primary procedure.
    '13131':
        >-
          The provider repairs a wound measuring 1.1 cm to 2.5 cm in size of the cheeks, chin, mouth, neck, axillae, genitalia, hands, and/or feet, which may require\_scar revision, debridement extensive undermining of tissues, and stents or retention sutures in addition to a layered closure.
    '14000':
        >-
          In an adjacent tissue transfer (ATT) of the trunk, the provider transfers a skin part to another skin segment on the trunk.\_ This code is for an ATT 10 cm2 in size or less.
    '13153':
        >-
          The provider performs closure of a wound/laceration for at least one of
          the following anatomic areas: eyelids, nose, ears, lips. The repair
          performed is of a complex nature, which involves more than a layered
          type closure. This code represents repair of an additional 5 cm or less
          after a separately reportable 7.5 cm repair.
    '14001':
        >-
          The provider repairs defects in the patient’s trunk by using healthy
          tissues from an adjacent body part. This code represents transfer of
          adjacent tissue for defects that equal 10.1 cm2 and up to 30.0 cm2.
    '14020':
        >-
          The provider repairs the defects in the patient’s scalp, arms, and/or
          legs by using healthy tissues from an adjacent site. This code
          represents services for defects of 10 cm2 or less.
    '14040':
        >-
          The provider repairs lesions in the patient’s forehead, cheeks, chin,
          mouth, neck, axillae or armpits, genitalia, hands, and/or feet by using
          healthy tissues from an adjacent site. This code represents a defect of
          10 cm2 or less.
    '13133':
        >-
          The provider repairs a wound of the cheeks, chin, mouth, neck, axillae, genitalia, hands, and/or feet, which may require\_scar revision, debridement extensive undermining of tissues, and stents or retention sutures in addition to a layered closure. Report this code for each additional 5 cm or less over and above the initial repair.
`
}
