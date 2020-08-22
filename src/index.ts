import _ from 'lodash'
import { Account } from '@aitmed/cadl'
import { createBrowserHistory } from 'history'
import { cadl, noodl } from 'app/client'
import app from 'App'
import './styles.css'

window.addEventListener('load', async function hello() {
  window.account = Account
  window.env = process.env.ECOS_ENV
  window.cadl = cadl
  window.noodl = cadl
  // Auto login for the time being
  const vcode = await Account.requestVerificationCode('+1 8882465555')
  const profile = await Account.login('+1 8882465555', '142251', vcode || '')
  console.log(`%c${vcode}`, 'color:green;font-weight:bold;')
  console.log(`%cProfile`, 'color:green;font-weight:bold;', profile)

  // Initialize user/auth state, store, and handle initial route
  // redirections before proceeding
  await app.initialize()

  const components = noodl.resolveComponents()
  _.forEach(components[0].children, console.log)

  app.render(components)
})
