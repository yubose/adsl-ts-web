import { ConsumerOptions } from 'noodl-ui'
import App from '../App'

const createPickPage = (app: App) => (opts: ConsumerOptions) =>
  opts ? app.ndom.findPage(opts.page) : app.mainPage

export default createPickPage
