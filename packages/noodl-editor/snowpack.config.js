// Example: snowpack.config.mjs
// The added "@type" comment will enable TypeScript type information via VSCode, etc.

/** @type { import("snowpack").SnowpackUserConfig } */
const snowpackConfig = {
	alias: {},
	devOptions: {
		hostname: '127.0.0.1',
		open: false,
		port: 3000,
	},
	env: {
		ECOS_ENV: process.env.ECOS_ENV,
		NODE_ENV: process.env.NODE_ENV,
	},
	packageOptions: {
		env: {
			NODE_ENV: true,
		},
		knownEntrypoints: ['src/index.ts'],
		source: 'local',
		stats: true,
		types: true,
	},
	plugins: [],
	mount: {
		public: {
			resolve: false,
			static: true,
			url: '/',
		},
		src: {
			url: '/dist',
		},
	},
}

export default snowpackConfig
