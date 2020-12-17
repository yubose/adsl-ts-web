// import Logger from 'logsnap'
import Component from '../components/Base'
import List from '../components/List'
import ListItem from '../components/ListItem'

// const log = Logger.create('isComponent')

function isComponent(component: any): component is Component | List | ListItem {
  // log.info(`Is component? ${component instanceof Component}`, component)
  return !!(
    component &&
    typeof component !== 'string' &&
    typeof component.children === 'function'
  )
}

export default isComponent
