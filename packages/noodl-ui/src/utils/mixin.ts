import Base from '../components/Base'
import Page from '../components/Page'

const createMixin = (subclass) =>
  class extends subclass {
    sayHello() {
      console.log('hello!')
    }
  }

const _originalMixin = Symbol('_originalMixin')
const _mixinRef = Symbol('_mixinRef')
const _cachedApplicationRef = Symbol('_cachedApplicationRef')

const wrap = (mixin, wrapper) => {
  Object.setPrototypeOf(wrapper, mixin)
  if (!mixin[_originalMixin]) {
    mixin[_originalMixin] = mixin
  }
  return wrapper
}

const BaseMixin = (mixin) =>
  wrap(mixin, (superclass) => {
    let application = mixin(superclass)
    application.prototype[_mixinRef] = mixin[_originalMixin]
    return application
  })

const Cached = (mixin) =>
  wrap(mixin, (superclass) => {
    let applicationRef = mixin[_cachedApplicationRef]

    if (!applicationRef) {
      applicationRef = mixin[_cachedApplicationRef] = Symbol(mixin.name)
    }

    if (superclass.hasOwnProperty(applicationRef)) {
      return superclass[applicationRef]
    }

    let application = mixin[superclass]

    superclass[applicationRef] = application

    return application
  })
