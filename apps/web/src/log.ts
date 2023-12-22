import loglevel from 'loglevel'
// let env = process.env.NODE_ENV
let env = process.env.ECOS_ENV

// if (env === 'development') {
if(env === "test") {
    loglevel.setDefaultLevel('DEBUG')
    loglevel.setLevel('DEBUG')
}else{
    loglevel.setDefaultLevel('WARN')
    loglevel.setLevel('WARN')
}
export default loglevel