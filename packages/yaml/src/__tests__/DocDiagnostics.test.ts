import { expect } from 'chai'
import y from 'yaml'
import sinon from 'sinon'
import fs from 'fs-extra'
import path from 'path'
import { consts, is as coreIs } from '@noodl/core'
import assertAppConfig from '../asserters/init/assertAppConfig'
import assertRef from '../asserters/assertRef'
import { createAssert, createAsyncAssert } from '../assert'
import createNode from '../utils/createNode'
import deref from '../utils/deref'
import is from '../utils/is'
import unwrap from '../utils/unwrap'
import DocDiagnostics from '../DocDiagnostics'
import DocRoot from '../DocRoot'
import DocVisitor from '../DocVisitor'

let docDiagnostics: DocDiagnostics
let docRoot: DocRoot
let docVisitor: DocVisitor

beforeEach(() => {
  docDiagnostics = new DocDiagnostics()
  docRoot = new DocRoot()
  docVisitor = new DocVisitor()

  docDiagnostics.use(docVisitor)
  docDiagnostics.use(docRoot)

  docRoot.set('BaseHeader', {
    type: 'header',
    style: { width: '1', height: 'auto', top: '0.1', left: '0.125' },
  })

  docRoot.set('Cereal', {
    icon: '..realIcon',
    realIcon: 'you-found-me.png',
    components: [
      '.BaseHeader',
      { type: 'button', text: '..icon' },
      { type: 'label', text: '..iconName' },
    ],
  })
})

describe.only(`DocDiagnostics`, () => {
  describe(`asserts`, () => {
    xdescribe(`createAssert`, () => {
      it(`should add indent, offset, and range automatically`, () => {
        const spy = sinon.spy()
        // const node = createNode('.Cereal.icon')
        const results = docDiagnostics.run({
          enter: ({ add, node }) => {
            add({})
          },
        })
        docDiagnostics.print(results)
      })
    })

    it(`[mark] should mark the rootConfig`, () => {
      expect(docDiagnostics.markers.rootConfig).to.eq('')
      docDiagnostics.mark('rootConfig', 'admind3')
      expect(docDiagnostics.markers.rootConfig).to.eq('admind3')
    })

    it(`[mark] should mark the appConfig`, () => {
      expect(docDiagnostics.markers.appConfig).to.eq('')
      docDiagnostics.mark('appConfig', 'cadlEndpoint')
      expect(docDiagnostics.markers.appConfig).to.eq('cadlEndpoint')
    })

    it(`[mark] should mark preload pages`, () => {
      expect(docDiagnostics.markers.preload).to.be.empty
      docDiagnostics.mark('preload', 'BaseCSS')
      expect(docDiagnostics.markers.preload).to.have.lengthOf(1)
      expect(docDiagnostics.markers.preload[0]).to.eq('BaseCSS')
      docDiagnostics.mark('preload', 'BasePage')
      expect(docDiagnostics.markers.preload).to.have.lengthOf(2)
      expect(docDiagnostics.markers.preload[1]).to.eq('BasePage')
    })

    it(`[mark] should mark pages`, () => {
      expect(docDiagnostics.markers.pages).to.be.empty
      docDiagnostics.mark('page', 'Dashboard')
      expect(docDiagnostics.markers.pages).to.have.lengthOf(1)
      expect(docDiagnostics.markers.pages[0]).to.eq('Dashboard')
      docDiagnostics.mark('page', 'SignOut')
      expect(docDiagnostics.markers.pages).to.have.lengthOf(2)
      expect(docDiagnostics.markers.pages[1]).to.eq('SignOut')
    })

    describe(`assertRef`, () => {
      it(`should replace tilde references`, () => {
        docRoot.clear()
        docRoot.set('Topo', { formValues: '~/Topo' })
        docDiagnostics.mark('baseUrl', 'https://hello.com/')
        docDiagnostics.run({
          enter: (args) => {
            if (is.reference(args.node)) assertRef(args)
          },
        })
        expect(unwrap(docDiagnostics.root?.get('Topo.formValues'))).to.eq(
          'https://hello.com/Topo',
        )
      })

      it(`should update reference nodes that are resolvable`, () => {
        process.stdout.write('\x1Bc')
        docRoot.set('Cereal', {
          profile: { user: { avatar: '.Cereal.realIcon' } },
          icon: '..realIcon',
          realIcon: 'you-found-me.png',
          components: [{ type: 'button', text: '..icon' }],
        })
        docRoot.set('Tower', {
          profile: '.Cereal.profile',
          props: { name: 'Bob', profile: '..profile' },
          components: [
            {
              type: 'view',
              children: [{ type: 'button', props: '.Tower.props' }],
            },
          ],
        })

        docDiagnostics.run({
          enter: (args) =>
            void (
              (is.reference(args.node) && assertRef(args)) ||
              (coreIs.reference(args.node) && assertRef(args))
            ),
        })
        const Cereal = docRoot.get('Cereal').toJSON()
        const Tower = docRoot.get('Tower').toJSON()
        expect(unwrap(Cereal.profile.user.avatar)).to.eq('you-found-me.png')
        expect(unwrap(Cereal.icon)).to.eq('you-found-me.png')
        expect(unwrap(Cereal.components[0].text)).to.eq('you-found-me.png')
        expect(Tower.profile).to.deep.eq(Cereal.profile)
        expect(Tower.props.profile).to.deep.eq(Cereal.profile)
        expect(Tower.components[0].children[0].props).to.deep.eq(Tower.props)
      })

      it(`should add unresolvable references to diagnostics`, () => {
        process.stdout.write('\x1Bc')
        docRoot.clear()

        const Resource = {
          user: '.Resource.formValues',
          formValues: '..currentFormValues',
          currentFormValues: '.Tiger.incorrect.Path.toFormValues',
        }

        const Tiger = {
          formData: {
            profile: '..profile',
          },
          profile: {
            user: '.Resource.user',
          },
          formValues: {
            firstName: 'Bob',
            lastName: 'Gonzalez',
          },
        }

        docRoot.set('Resource', Resource)
        docRoot.set('Tiger', Tiger)
        docRoot.set('A', { fs: 's' })

        docDiagnostics.mark('rootConfig', 'A')
        docDiagnostics.mark('appConfig', 'cadlEndpoint')
        docDiagnostics.mark('preload', 'BaseCSS')
        docDiagnostics.mark('preload', 'BasePage')
        docDiagnostics.mark('page', 'SignOut')

        docDiagnostics.root?.set('cadlEndpoint', {
          preload: ['BaseCSS'],
          page: ['SignIn', 'Dashboard', ''],
        })

        const diagnostics = docDiagnostics.run({
          enter: (args) => {
            if (is.reference(args.node) || coreIs.reference(args.node)) {
              return assertRef(args)
            }
          },
        })

        docDiagnostics.print(diagnostics)

        console.dir(docRoot.toJSON(), { depth: Infinity })
      })
    })
  })
})
