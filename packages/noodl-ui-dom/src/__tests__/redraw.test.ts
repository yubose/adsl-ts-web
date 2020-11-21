import { expect } from 'chai'
import sinon from 'sinon'
import fs from 'fs-extra'
import { findChild } from 'noodl-utils'
import { prettyDOM, waitFor } from '@testing-library/dom'
import {
  createComponent,
  IComponentTypeInstance,
  IList,
  IListEventId,
  IListItem,
  List,
  NOODLComponent,
} from 'noodl-ui'
import { noodlui, noodluidom } from '../test-utils'
import EmitRedraw from './helpers/EmitRedraw.json'

const save = (data: any) => {
  fs.writeJsonSync('redraw.json', data, { spaces: 2 })
}

let noodlView: NOODLComponent
let noodlListDemographics: NOODLComponent
let noodlListGender: NOODLComponent

let components: IComponentTypeInstance[]
let view: IComponentTypeInstance
let listDemographics: IList
let listGender: IList

beforeEach(() => {})

beforeEach(() => {
  noodlView = EmitRedraw.components[2] as NOODLComponent
  noodlListDemographics = EmitRedraw.components[2][2] as NOODLComponent
  noodlListGender = EmitRedraw.components[2][3] as NOODLComponent
  components = noodlui.resolveComponents(
    EmitRedraw.components as NOODLComponent[],
  )
  view = components[3] as IComponentTypeInstance
  listDemographics = view.child(2) as IList
  listGender = view.child(3) as IList
  // {
  //   const data = listDemographics.getData().slice()
  //   data.forEach((d) => listDemographics.removeDataObject(d))
  //   data.forEach((d) => listDemographics.addDataObject(d))
  // }
  // {
  //   const data = listGender.getData().slice()
  //   data.forEach((d) => listGender.removeDataObject(d))
  //   data.forEach((d) => listGender.addDataObject(d))
  // }
})

describe('redraw', () => {
  it("should clean up the component's listeners", () => {
    const addSpy = sinon.spy()
    const deleteSpy = sinon.spy()
    const retrieveSpy = sinon.spy()
    const updateSpy = sinon.spy()
    const evts = {
      'add.data.object': addSpy,
      'delete.data.object': deleteSpy,
      'retrieve.data.object': retrieveSpy,
      'update.data.object': updateSpy,
    } as const
    const evtNames = Object.keys(evts)
    listGender.on('add.data.object', addSpy)
    listGender.on('delete.data.object', deleteSpy)
    listGender.on('retrieve.data.object', retrieveSpy)
    listGender.on('update.data.object', updateSpy)
    evtNames.forEach((evt) => {
      expect(listGender.hasCb(evt as IListEventId, evts[evt])).to.be.true
    })
    const node = noodluidom.parse(listGender)
    noodluidom.redraw(node, listGender)
    evtNames.forEach((evt) => {
      expect(listGender.hasCb(evt as IListEventId, evts[evt])).to.be.false
    })
  })

  it('should remove the parent reference', () => {
    expect(listGender.parent()).to.eq(view)
    const node = noodluidom.parse(listGender)
    noodluidom.redraw(node, listGender)
    expect(listGender.parent()).to.be.null
  })

  it("should remove the component from the parent's children", () => {
    expect(view.hasChild(listGender)).to.be.true
    const node = noodluidom.parse(listGender)
    noodluidom.redraw(node, listGender)
    expect(view.hasChild(listGender)).to.be.false
  })

  it('should recursively remove child references', () => {
    const node = noodluidom.parse(view)
    const listItem = listGender.child()
    const label = listItem?.child(0)
    const image = listItem?.child(1)
    expect(!!findChild(view, (c) => c === image)).to.be.true
    expect(!!findChild(view, (c) => c === label)).to.be.true
    noodluidom.redraw(node, view)
    expect(!!findChild(view, (c) => c === image)).to.be.false
    expect(!!findChild(view, (c) => c === label)).to.be.false
  })

  xit('should recursively remove child listeners', async () => {
    const spies = {
      hello: sinon.spy(),
      bye: sinon.spy(),
      fruit: sinon.spy(),
    }
    const node = noodluidom.parse(view)
    listGender.on('add.data.object', spies.hello)
    const listItem = listGender.child() as IListItem
    const label = listItem?.child(0)
    const image = listItem?.child(1)
    image?.on('bye', spies.bye)
    label?.on('fruit', spies.fruit)
    expect(listGender.hasCb('add.data.object', spies.hello)).to.be.true
    expect(image.hasCb('bye', spies.bye)).to.be.true
    expect(label.hasCb('fruit', spies.fruit)).to.be.true
    noodluidom.redraw(node, view)
    save(image?.toJS())
    console.info(image)
    expect(listGender.hasCb('add.data.object', spies.hello)).to.be.false
    expect(image.hasCb('bye', spies.bye)).to.be.false
    expect(label.hasCb('fruit', spies.fruit)).to.be.false
  })

  it('should remove the node by the parentNode', () => {
    noodluidom.on('component', onComponentAttachId)
    noodluidom.parse(view)
    const listItem = listGender.child() as IListItem
    const image = listItem?.child(1)
    const imageNode = document.getElementById(image?.id)
    expect(!!imageNode?.parentNode?.contains(imageNode)).to.be.true
    noodluidom.redraw(imageNode, image)
    expect(!!imageNode?.parentNode?.contains(imageNode)).to.be.false
    noodluidom.off('component', onComponentAttachId)
  })

  it("should use the removing component's attrs as a blueprint to re-resolve the new one", () => {
    noodluidom.on('component', onComponentAttachId)
    noodluidom.parse(view)
    const listItem = listGender.child() as IListItem
    const liNode = document.getElementById(listItem?.id || '')
    const label = listItem?.child()
    const { type, dataKey, style, listId, iteratorVar, noodlType, listIndex } =
      label?.original || {}
    const labelNode = document.getElementById(label?.id)
    expect(listItem.hasChild(label)).to.be.true
    noodluidom.redraw(liNode, listItem)
    expect(listItem.hasChild(label)).to.be.false
    noodluidom.off('component', onComponentAttachId)
  })

  xit('should deeply resolve the entire noodl-ui component tree down', () => {
    //
  })

  xit('should deeply resolve the entire dom node tree down', () => {
    //
  })

  it('should attach to the original parentNode as the new childNode', () => {
    noodluidom.on('component', onComponentAttachId)
    noodluidom.parse(view)
    const listItem = listGender.child() as IListItem
    const liNode = document.getElementById(listItem?.id || '')
    const ulNode = liNode?.parentNode
    expect(ulNode.contains(liNode)).to.be.true
    noodluidom.redraw(liNode, listItem)
    expect(ulNode.contains(liNode)).to.be.false
    noodluidom.off('component', onComponentAttachId)
    throw new Error('last left off')
  })
})

function onComponentAttachId(node: any, component: any) {
  node.id = component.id
}
