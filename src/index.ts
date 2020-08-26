import _ from 'lodash'
import { Account } from '@aitmed/cadl'
import { getDataValues } from 'noodl-ui'
import { cadl } from 'app/client'
import app from 'App'
import './styles.css'

window.addEventListener('load', async function hello() {
  window.account = Account
  window.env = process.env.ECOS_ENV
  window.getDataValues = getDataValues
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

  window.modal = app.page.modal

  window.modal.render()

  const store = app.getStore()

  store.subscribe((...args) => {
    console.log(...args)
    console.log(...args)
    console.log(...args)
    console.log(...args)
    console.log(...args)
  })

  const testNode = document.createElement('div')
  app.page.modal.setStyle(testNode, { width: '100%', height: '100%' })
  testNode.innerHTML += `
    <div style="width:100%;height:100%;border:1px solid red;">
      <h4>Title</h4>
      <small>Subtitle</small>
      <div>
        constructor that can be used to create a second "immer" instance (exposing all APIs listed in this instance), that doesn't share its settings with global instance.
      </div>
    </div>
  `
  window.modal.appendChild(testNode)
  // Callback which is crucial for components/nodes to be in sync
  // app.page.registerListener(
  //   'onAfterPageChange',
  //   async ({ previousPage, next: nextPage }: OnAfterPageChangeArgs) => {
  //     const logMsg = `%c[App.tsx][onAfterPageChange] ${previousPage} --> ${nextPage.name}`
  //     const logStyle = `color:#3498db;font-weight:bold;`
  //     console.log(logMsg, logStyle, { previousPage, nextPage })

  //     console.log(
  //       `%c[onPageChange] currentUser.vertex`,
  //       `color:#3498db};font-weight:bold;`,
  //       cadl.root?.Global?.currentUser.vertex,
  //     )

  //     if (nextPage.name) {
  //       // Parse the components
  //       const components = noodl
  //         // TODO: Leave this binded to the lib
  //         .setRoot(cadl.root)
  //         .setPage(nextPage)
  //         .resolveComponents()
  //       // Render them to the UI
  //       this.page.render(components)
  //     }
  //   },
  // )
})
