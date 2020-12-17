import resolve from './resolve'

function register(...args: Parameters<typeof resolve['register']>) {
  return resolve.register(...args)
}

export default register
