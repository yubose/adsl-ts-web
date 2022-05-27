process.stdout.write('\x1Bc')
const axios = require('axios').default
const y = require('yaml')
const fse = require('fs-extra')
const path = require('path')
const fg = require('fast-glob')
const n = require('noodl-core')
const u = require('@jsmanifest/utils')
const ny = require('noodl-yaml')

/**
 * @typedef CSTTokenType
 * @type { y.CST.TokenType | y.CST.SourceToken['type'] }
 *
 * @typedef CreateCSTTokenOptions
 * @type { Parameters<typeof y.CST.createScalarToken>[1] }
 */

const lexer = new y.Lexer()
const composer = new y.Composer()
const parser = new y.Parser()
const factory = ny.factory
const is = ny.is
const getFilePath = (...s) => path.join(__dirname, ...s)

const fs = ny.createFileSystem(function getFs() {
  return {
    ...fse,
    getBaseName: path.basename,
    isAbsolute: path.isAbsolute,
  }
})

const filepath = path.join(__dirname, '../generated/admind3/BasePage.yml')
const SignInYml = `SignIn:
   init: null
   buttonText: Send!
   formData:
     profile:
       user:
         name: Bob
         age: 30
         gender: .Topo.selectedGender

 `
const TopoYml = `Topo:
   init:
     - ..selectedGender: Other
   fruits:
     - apple
   selectedGender: ''
   genders:
     - value: female
       label: Female
     - value: male
       label: Male
     - value: other
       label: Other
   components:
     - type: view
       children:
         - type: scrollView
           children:
             - type: list
               iteratorVar: itemObject
               listObject: ..genders
               children:
                 - type: listItem
                   itemObject: ''
                   children:
                     - type: label
                       dataKey: itemObject.label
                     - type: textField
                       dataKey: itemObject.value
             - type: button
               text: .SignIn.buttonText
 `
