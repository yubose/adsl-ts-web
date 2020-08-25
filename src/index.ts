import _ from 'lodash'
import { Account } from '@aitmed/cadl'
import { cadl } from 'app/client'
import app from 'App'
import './styles.css'

window.addEventListener('load', async function hello() {
  window.account = Account
  window.env = process.env.ECOS_ENV
  window.noodl = cadl
  window.noodlui = app
  // Auto login for the time being
  const vcode = await Account.requestVerificationCode('+1 8882465555')
  const profile = await Account.login('+1 8882465555', '142251', vcode || '')
  console.log(`%c${vcode}`, 'color:green;font-weight:bold;')
  console.log(`%cProfile`, 'color:green;font-weight:bold;', profile)
  // Initialize user/auth state, store, and handle initial route
  // redirections before proceeding
  await app.initialize()
})
