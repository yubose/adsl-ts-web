import * as u from '@jsmanifest/utils'
import { App, createInstance } from '../../lib/lib'

const _color = 'navajowhite'

window.addEventListener('load', async (evt) => {
  const app = new App()
  const lvl3Sdk = createInstance({
    configUrl: `https://d2bbkxkl9sogfu.cloudfront.net/config/admind3.yml`,
    env: 'stable',
    overwrite: true,
  })
  app.use(lvl3Sdk)
  await app.initialize()
  console.log(app)
  //
})
