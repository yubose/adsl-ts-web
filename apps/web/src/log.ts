import loglevel from 'loglevel'
let env = process.env.NODE_ENV

if (env === 'development') {
    loglevel.setDefaultLevel('DEBUG')
}else{
    loglevel.setDefaultLevel('WARN')
}
export default loglevel