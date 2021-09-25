import { NUI as nui } from '../packages/noodl-ui'

window.addEventListener('load', function (evt) {
  console.log(`%c[load] DOM ready`, `color:#00b406;`, evt)
  console.log(nui.getRoot())
})
