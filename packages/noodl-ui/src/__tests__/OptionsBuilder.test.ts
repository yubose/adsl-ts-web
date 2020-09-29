import { expect } from 'chai'
import _ from 'lodash'
import OptionsBuilder from '../OptionsBuilder'
import Viewport from '../Viewport'
import { Resolver, ResolverOptions } from '../types'

let builder: OptionsBuilder

beforeEach(() => {
  builder = new OptionsBuilder()
})

describe('OptionsBuilder', () => {
  describe('build', () => {
    let assetsUrl: string,
      resolvers: Resolver[],
      roots: { [key: string]: any },
      page: { name: string; object: any },
      viewport: Viewport

    beforeEach(() => {
      assetsUrl = 'https://www.hello.com/assets/'
      resolvers = [() => 1, () => 2, () => 3]
      roots = { a: 'abc' }
      page = { name: 'SignIn', object: { SignIn: { module: 'patient' } } }
      viewport = new Viewport()
      viewport.width = 20
      viewport.height = 50
    })

    describe('resolver options', () => {
      it('should return the expected resolver options (non-consumer)', () => {
        const result = builder
          .setAssetsUrl(assetsUrl)
          .setResolvers(resolvers)
          .setRoots(roots)
          .setPage(page)
          .setViewport(viewport)
          .build()

        expect(result).to.deep.equal({
          context: {
            assetsUrl,
            page,
            viewport,
            roots,
          },
          resolvers,
        })
      })

      it('should include the resolvers automatically', () => {
        const result = builder.build() as ResolverOptions
        expect(result).to.have.property('resolvers')
        expect(_.isArray(result.resolvers)).to.be.true
      })

      it('should return the resolver context object', () => {
        const result = builder.build() as ResolverOptions
        expect(result).to.have.property('context')
        _.forEach(['assetsUrl', 'page', 'roots', 'viewport'], (key) => {
          expect(result.context).to.have.property(key)
        })
      })
    })

    describe('resolver consumer options', () => {
      const builderOptions = {
        type: 'consumer',
      } as const

      _.forEach(['assetsUrl', 'page', 'roots', 'viewport'], (key) => {
        it(`should include the "${key}" property into context`, () => {
          const result = builder
            .setAssetsUrl(assetsUrl)
            .setResolvers(resolvers)
            .setRoots(roots)
            .setPage(page)
            .setViewport(viewport)
            .build(builderOptions) as ResolverOptions

          expect(result).not.to.have.property(key)
          expect(result.context).to.have.property(key)
        })
      })

      _.forEach(['listeners', 'resolvers'], (key) => {
        it(`should not include the ${key}`, () => {
          const result = builder
            .setAssetsUrl(assetsUrl)
            .setResolvers(resolvers)
            .setRoots(roots)
            .setPage(page)
            .setViewport(viewport)
            .build(builderOptions)

          expect(result).not.to.have.property(key)
        })
      })
    })

    describe('resolver context', () => {
      it('should return the expected object', () => {
        const result = builder.build({ type: 'context' })
        expect(result).to.have.property('assetsUrl')
        expect(result).to.have.property('page')
        expect(result).to.have.property('roots')
        expect(result).to.have.property('viewport')
      })

      _.forEach(['listeners', 'resolvers'], (key) => {
        it(`should not include the ${key}`, () => {
          const result = builder.build({ type: 'context' })
          expect(result).not.to.have.property(key)
        })
      })
    })
  })

  describe('page', () => {
    it('should be able to change the page name', () => {
      expect(builder.page.name).to.equal('')
      builder.setPageName('hello')
      expect(builder.build({ type: 'context' }).page).to.have.property(
        'name',
        'hello',
      )
    })

    it('should be able to change the page object', () => {
      expect(builder.page.object).to.equal(null)
      builder.setPageObject({ fruits: ['apple'] })
      expect(builder.build({ type: 'context' }).page.object).to.deep.equal({
        fruits: ['apple'],
      })
    })

    it('should be able to set the complete page object', () => {
      const page = { name: 'apple', object: { color: 'red' } }
      expect(builder.page).to.deep.equal({ name: '', object: null })
      builder.setPage(page)
      expect(builder.build({ type: 'context' }).page).to.deep.equal(page)
    })
  })

  describe('resolvers', () => {
    const fn1 = () => {}
    const fn2 = () => {}
    const fn3 = () => {}
    let resolvers = [fn1, fn2, fn3]

    it('should be able to add resolvers using positional arguments', () => {
      builder.addResolvers(...resolvers)
      const resolverOptions = builder.build() as ResolverOptions
      expect(resolverOptions.resolvers).to.deep.equal(resolvers)
    })

    it('should be able to add resolvers using a single array', () => {
      builder.addResolvers(resolvers)
      const resolverOptions = builder.build() as ResolverOptions
      expect(resolverOptions.resolvers).to.deep.equal(resolvers)
    })

    it('should be able to add a single resolver', () => {
      builder.addResolvers(fn1)
      const resolverOptions = builder.build() as ResolverOptions
      expect(resolverOptions.resolvers).to.deep.equal([fn1])
    })

    it('should be able to remove resolvers', () => {
      let result
      builder.addResolvers(...resolvers)
      result = (builder.build() as ResolverOptions).resolvers
      expect(result).to.deep.equal(resolvers)
      builder.removeResolver(fn2)
      result = (builder.build() as ResolverOptions).resolvers
      expect(result).not.to.deep.equal(resolvers)
      expect(result).to.include(fn1)
      expect(result).not.to.include(fn2)
      expect(result).to.include(fn3)
    })
  })

  describe('viewport', () => {
    it('should be able to set the viewport width', () => {
      builder.setViewportWidth(350)
      expect(builder.build({ type: 'context' }).viewport).to.have.property(
        'width',
        350,
      )
    })

    it('should be able to set the viewport height', () => {
      builder.setViewportHeight(350)
      expect(builder.build({ type: 'context' }).viewport).to.have.property(
        'height',
        350,
      )
    })

    it('should be able to set the whole viewport object', () => {
      builder.setViewport({ width: 200, height: 0 })
      expect(builder.build({ type: 'context' }).viewport).to.deep.equal({
        width: 200,
        height: 0,
      })
    })
  })
})
