import axios from 'axios'
import {
  findByDataAttrib,
  findByDataKey,
  findByElementId,
  findByGlobalId,
  findByPlaceholder,
  findBySelector,
  findBySrc,
  findByViewTag,
  findByUX,
  findWindow,
  findWindowDocument,
} from 'noodl-ui'
import { exportToPDF } from './utils/dom'
/**
 * Just a helper to return the utilities that are meant to be attached
 * to the global window object
 */
export function getWindowHelpers() {
  return {
    findByDataAttrib,
    findByDataKey,
    findByElementId,
    findByGlobalId,
    findByPlaceholder,
    findBySelector,
    findBySrc,
    findByViewTag,
    findByUX,
    findWindow,
    findWindowDocument,
  }
}

window.addEventListener('load', async function (evt) {
  const resp = await axios.get(`http://127.0.0.1:3000/`)
  const title = 'patient chart for the next 3 months'
  const content =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce ut aliquam diam, nec luctus magna. Aenean et augue non felis euismod molestie id faucibus ligula. Phasellus a augue sed dui molestie finibus. Cras sit amet semper est. Ut hendrerit fermentum facilisis. Suspendisse nec mi eget dui varius lobortis vel non ipsum. Morbi id risus lacus. Nunc porttitor nisl quis lacinia porta.'
  const img = document.createElement('img')
  img.src = 'ava.png'
  img.style.width = '375px'
  this.document.body.appendChild(img)

  img.addEventListener('load', async function (evt) {
    window['exportToPDF'] = exportToPDF
  })
})
