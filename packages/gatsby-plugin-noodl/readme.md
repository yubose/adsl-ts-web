# gatsby-plugin-noodl

## Installation

```bash
npm install --save gatsby-plugin-noodl
```

## Usage

Enter this into your `gatsby-config.js` inside `plugins`:

```js
module.exports = {
  siteMetadata: {
    siteTitle: '',
  },
  plugins: ['gatsby-plugin-noodl'],
}
```

Alternatively you can provide options to the plugin by passing them into the `options` property:

```js
module.exports = {
  siteMetadata: {
    siteTitle: '',
  },
  plugins: [
    {
      resolve: 'gatsby-plugin-noodl',
      options: {
        assets: './src/resources/assets',
        config: 'www',
        ecosEnv: 'test',
        template: require.resolve('./src/templates/page.tsx'),
      },
    },
  ],
}
```

## Plugin Options

### `template` (required)

The path to the template page that will be rendering noodl pages

### `assets` (optional)

The path to save downloaded assets to

### `config` (optional)

The config name (example: `'meetd2'`)

Defaults to `aitmed`

### `ecosEnv` (optional)

The eCOS environment. Defaults to `stable`

| Environment | Value      |
| ----------- | ---------- |
| Stable      | `'stable'` |
| Test        | `'test'`   |

### `loglevel`(optional)

Logging output level. Defaults to `info`

| Level      | Description                        |
| ---------- | ---------------------------------- |
| `'error'`  | Only log errors                    |
| `'warn'`   | Only log warnings and errors       |
| `'info'`   | Only log info, warnings and errors |
| `'debug'`  | Log everything                     |
| `'silent'` | Disable all logging                |

### `path` (optional)

The path to save yml files to

### `viewport` (optional)

The viewport used to calculate the dimensions for static pages

Defaults to `{ width: 1024, height: 768 }`
