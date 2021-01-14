import Base from '../components/Base'
// import Page from '../components/Page'
import NOODLUI from '../noodl-ui'

const createMixin = <S extends new (...args: any[]) => any>(subclass: S) =>
  new MixinBuilder(subclass)

class MixinBuilder {
  subclass: new (...args: any[]) => any
  constructor(subclass: MixinBuilder['subclass']) {
    this.subclass = subclass
  }

  with(...mixins: any[]) {
    return mixins.reduce((c, mixin) => mixin(c), this.subclass)
  }
}

const noodlui = new NOODLUI()
const mixin = class Page extends createMixin(new Base()) {
  sayHello() {
    console.log('hi')
  }
}

console.log(mixin.sayHello())
