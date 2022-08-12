const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')

module.exports = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  core: {
    builder: 'webpack5',
  },
  framework: '@storybook/react',
  typescript: {
    check: false,
    checkOptions: {},
    reactDocgen: false,
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: false,
      propFilter: (prop) =>
        prop.parent ? !/node_modules/.test(prop.parent.fileName) : true,
    },
  },
  // babel: (config) => {
  //   const indexOfBabelPresetReact = config.presets.findIndex((preset) => {
  //     if (Array.isArray(preset)) {
  //       if (preset[0].includes('@babel/preset-react/lib/index.js')) {
  //         return true
  //       }
  //     }
  //   })
  //   if (indexOfBabelPresetReact > -1) {
  //     const currPreset = config.presets.splice(indexOfBabelPresetReact, 1)[0]
  //     currPreset[1] = {
  //       ...currPreset[1],
  //       importSource: '@theme-ui/core',
  //     }
  //     config.presets.push(currPreset)
  //   }
  //   return config
  // },
  webpackFinal: async (config, { configType }) => {
    // Transpile Gatsby module because Gatsby includes un-transpiled ES6 code.
    config.module.rules[0].exclude = [/node_modules\/(?!(gatsby)\/)/]
    // Use babel-plugin-remove-graphql-queries to remove static queries from components when rendering in storybook
    config.module.rules[0].use[0].options.plugins.push(
      require.resolve('babel-plugin-remove-graphql-queries'),
    )
    config.resolve.plugins = [new TsconfigPathsPlugin()]
    return config
  },
  features: {
    emotionAlias: true,
    storyStoreV7: true,
  },
}
