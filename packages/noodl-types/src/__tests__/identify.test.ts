import * as com from 'noodl-common'
import { expect } from 'chai'
import * as t from '..'

const label = (s: string) => com.italic(com.white(s))

describe(com.coolGold('Identify'), () => {
	describe(label('actionChain'), () => {
		it(`should accept emit objects`, () => {
			expect(
				t.Identify.actionChain([
					{ emit: { dataKey: { var1: 'itemObject' } }, actions: [] },
				]),
			).to.be.true
		})

		it(`should accept goto objects`, () => {
			expect(
				t.Identify.actionChain([
					{ emit: { dataKey: { var1: 'itemObject' } }, actions: [] },
					{ goto: 'PatientDashboard' },
					{ toast: { message: 'Hello' } },
				]),
			).to.be.true
		})

		it(`should accept emit, goto, and toast objects`, () => {
			expect(
				t.Identify.actionChain([
					{ emit: { dataKey: { var1: 'itemObject' } }, actions: [] },
					{ goto: 'PatientDashboard' },
					{ toast: { message: 'Hello' } },
				]),
			).to.be.true
		})
	})

	describe(label('ecosObj'), () => {
		describe(`note/pdf`, () => {
			it(`should return true for note/pdf docs`, () => {
				const ecosObj: t.EcosDocument<any> = {
					name: {
						title: `note title`,
						data: `note's contents`,
						type: 'application/json',
					},
					subtype: { mediaType: 1 },
					type: 1025,
				}
				expect(t.Identify.ecosObj.doc(ecosObj)).to.be.true
			})

			it(`should return false for docs that are not note/pdf docs`, () => {
				const ecosObj: t.EcosDocument<any> = {
					name: {
						title: `note title`,
						data: `note's contents`,
						type: 'text/plain',
					},
					subtype: { mediaType: 1 },
					type: 1025,
				}
				expect(t.Identify.ecosObj.doc(ecosObj)).to.be.true
				ecosObj.subtype.mediaType = 2
				ecosObj.name.type = 'application/json'
				expect(t.Identify.ecosObj.doc(ecosObj)).to.be.true
				ecosObj.name.type = 'text/html'
				expect(t.Identify.ecosObj.doc(ecosObj)).to.be.false
				ecosObj.name.type = 'text/markdown'
				expect(t.Identify.ecosObj.doc(ecosObj)).to.be.false
				ecosObj.name.type = 'text/javascript'
				expect(t.Identify.ecosObj.doc(ecosObj)).to.be.false
				ecosObj.name.type = 'image/png'
				expect(t.Identify.ecosObj.doc(ecosObj)).to.be.false
				ecosObj.name.type = 'image/jpg'
				expect(t.Identify.ecosObj.doc(ecosObj)).to.be.false
				ecosObj.name.type = 'video/mp4'
				expect(t.Identify.ecosObj.doc(ecosObj)).to.be.false
			})
		})
	})

	describe(label(`reference`), () => {
		const tests = {
			evolve: {
				'.builtIn.isAndroid': false,
				'..setAndroid': false,
				'=.Global.currentUser.vertex.sk': true,
				'..appLink.url@': false,
				'=.builtIn.string.equal': true,
			},
			local: {
				'=.SignIn.loginNewDevice.edgeAPI.store': false,
				// '=.builtIn.math.random': false,
				'.Global.currentUser.dataCache.loadingDateTime@': false,
				'=.Global.currentUser.vertex.sk': false,
				'=..loginNewDevice.response.edge.deat.user_id': true,
				'=..rvCondition': true,
				'=.Global._nonce': false,
				'..formData.countryCode': true,
				'.formData.countryCode': true,
				'=.SignIn.formData.countryCode': false,
				'=..verificationCode.response.edge.deat.phone_number': true,
			},
			root: {
				'=.SignIn.loginNewDevice.edgeAPI.store': true,
				// '=.builtIn.math.random': true,
				'.Global.currentUser.dataCache.loadingDateTime@': true,
				'=.Global.currentUser.vertex.sk': true,
				'=..loginNewDevice.response.edge.deat.user_id': false,
				'=..rvCondition': false,
				'=.Global._nonce': true,
				'..formData.countryCode': false,
				'.formData.countryCode': false,
				'=.SignIn.formData.countryCode': true,
				'=..verificationCode.response.edge.deat.phone_number': false,
			},
			await: {
				'.builtIn.isAndroid': false,
				'..setAndroid': false,
				'=.Global.currentUser.vertex.sk': false,
				'.SignUp.formData.countryCode@': true,
				'.SignUp.formData.countryCode': false,
				'=.Global.currentUser.vertex.sk@': true,
			},
			traverse: {
				__message: false,
				'__.message': true,
				'_.message': true,
				'.message': false,
				message: false,
				// '=__.message': true,
				// '..__.message': true,
			},
			tilde: {
				__message: false,
				'_.message': false,
				'.message': false,
				message: false,
				'~/message': true,
				'~message': false,
				'~~/message': false,
				'/message': false,
			},
		}

		describe(`await references`, () => {
			Object.entries(tests.await).forEach(([reference, expectedValue]) => {
				it(`should be ${expectedValue} for ${reference}`, () => {
					expect(t.Identify.reference.isAwaitingVal(reference)).to.be[
						String(expectedValue)
					]
				})
			})
		})

		describe(`evolve references`, () => {
			Object.entries(tests.evolve).forEach(([reference, expectedValue]) => {
				it(`should be ${expectedValue} for ${reference}`, () => {
					expect(t.Identify.reference.isEval(reference)).to.be[
						String(expectedValue)
					]
				})
			})
		})

		describe(`local merge references`, () => {
			Object.entries(tests.local).forEach(([reference, expectedValue]) => {
				it(`should be ${expectedValue} for ${reference}`, () => {
					expect(t.Identify.reference.isLocal(reference)).to.be[
						String(expectedValue)
					]
				})
			})
		})

		describe(`root merge references`, () => {
			Object.entries(tests.root).forEach(([reference, expectedValue]) => {
				it(`should be ${expectedValue} for ${reference}`, () => {
					expect(t.Identify.reference.isRoot(reference)).to.be[
						String(expectedValue)
					]
				})
			})
		})

		describe(`traverse references`, () => {
			Object.entries(tests.traverse).forEach(([reference, expectedValue]) => {
				it(`should be ${expectedValue} for ${reference}`, () => {
					expect(t.Identify.reference.isTraverse(reference)).to.be[
						String(expectedValue)
					]
				})
			})
		})

		describe(`tilde references`, () => {
			Object.entries(tests.tilde).forEach(([reference, expectedValue]) => {
				it(`should be ${expectedValue} for ${reference}`, () => {
					expect(t.Identify.reference.isTilde(reference)).to.be[
						String(expectedValue)
					]
				})
			})
		})
	})

	describe(label('toast'), () => {
		it(`should be a toast`, () => {
			expect(t.Identify.folds.toast({ toast: { message: 'hello', style: {} } }))
				.to.be.true
		})
		it(`should not be a toast`, () => {
			expect(
				t.Identify.folds.toast({ toasft: { message: 'hello', style: {} } }),
			).to.be.false
			expect(t.Identify.folds.toast({})).to.be.false
			expect(t.Identify.folds.toast('fasfas')).to.be.false
			expect(t.Identify.folds.toast(5)).to.be.false
			expect(t.Identify.folds.toast(null)).to.be.false
		})
	})
})
