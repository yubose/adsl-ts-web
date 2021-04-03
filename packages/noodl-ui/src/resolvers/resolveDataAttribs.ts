// Resolve data attributes which get attached to the outcome as data-* properties
// If any emit objects are encountered the resolveActions resolver should be
// picking them up
import get from 'lodash/get'
import { Identify } from 'noodl-types'
import { excludeIteratorVar, findDataValue } from 'noodl-utils'
import Resolver from '../Resolver'
import * as n from '../utils/noodl'
import * as u from '../utils/internal'

const dataAttribsResolver = new Resolver('resolveDataAttribs')

dataAttribsResolver.setResolver((component, options, next) => {
  const original = component.blueprint || {}
  const { context, getAssetsUrl, getQueryObjects, getRoot, page } = options
  const {
    contentType,
    controls,
    dataKey,
    image,
    path,
    poster,
    required,
    resource,
    videoFormat,
    viewTag,
  } = original

  const iteratorVar = context?.iteratorVar || n.findIteratorVar(component)

  if (Identify.component.listItem(component)) {
    // When redrawing a listItem the context must be customly injected back into the context via invoking resolveComponents directly, since by default the only way to receive this information is through rendering listItem children from the list parent
    if (!component.get(iteratorVar) && context?.dataObject) {
      component.edit(iteratorVar, context.dataObject)
      !u.isNil(context.index) && component.edit('index', context.index)
    }
  }

  /* -------------------------------------------------------
    ---- UI / VISIBILITY
  -------------------------------------------------------- */

  if (/(passwordHidden|messageHidden)/i.test(contentType)) {
    component.edit({ 'data-ux': contentType })
  } else if (/(vidoeSubStream|videoSubStream)/i.test(contentType)) {
    component.edit({ 'data-ux': contentType })
  }

  /* -------------------------------------------------------
    ---- POP UP
  -------------------------------------------------------- */

  if (Identify.component.popUp(original)) {
    component.edit({ 'data-ux': viewTag })
  }

  /* -------------------------------------------------------
    ---- LISTS
  -------------------------------------------------------- */

  if (n.isListLike(component)) {
    component.edit({ 'data-listid': component.id })
  }

  /* -------------------------------------------------------
    ---- REFERENCES / DATAKEY
  -------------------------------------------------------- */

  if (u.isStr(dataKey)) {
    let result: any
    if (!Identify.emit(dataKey)) {
      if (iteratorVar) {
        if (iteratorVar === dataKey) {
          result = context?.dataObject
        } else {
          result = get(
            context?.dataObject,
            excludeIteratorVar(dataKey, iteratorVar),
          )
        }
      } else {
        result = findDataValue(
          getQueryObjects({
            component,
            page,
            listDataObject: context?.dataObject,
          }),
          excludeIteratorVar(dataKey, iteratorVar),
        )
      }

      if (component.has('text=func')) {
        result = component.get('text=func')?.(result)
      }

      component.edit({ 'data-value': result })
    }

    // TODO - Deprecate this logic below for an easier implementation
    let fieldParts = dataKey?.split?.('.')
    let field = fieldParts?.shift?.() || ''
    let fieldValue = getRoot()?.[page.page]?.[field]

    if (fieldParts?.length) {
      while (fieldParts.length) {
        field = (fieldParts?.shift?.() as string) || ''
        field = field[0]?.toLowerCase?.() + field.substring(1)
        fieldValue = fieldValue?.[field]
      }
    } else {
      field = fieldParts?.[0] || ''
    }

    component.edit(
      { 'data-key': dataKey, 'data-name': field },
      { remove: 'dataKey' },
    )
  }

  /* -------------------------------------------------------
    ---- ARBITRARY PROP TRANSFORMING
  -------------------------------------------------------- */
  for (const [key = '', value] of component) {
    // Check the value if they are a string and are a reference
    if (u.isStr(value)) {
      /* -------------------------------------------------------
        ---- REFERENCES
      -------------------------------------------------------- */
      if (Identify.reference(value)) {
        if (key === 'style') {
          u.assign(
            component.style,
            n.parseReference(value, { page: page.page, root: getRoot() }),
          )
        } else {
          component.edit(
            n.parseReference(value, { page: page.page, root: getRoot() }),
          )
        }
      }
    }
  }

  /* -------------------------------------------------------
    ---- MEDIA
  -------------------------------------------------------- */

  if (poster) {
    component.edit({ poster: n.resolveAssetUrl(poster, getAssetsUrl()) })
  }

  Identify.isBoolean(controls) && component.edit({ controls: true })

  // Images / Videos
  if (path || resource || image) {
    let src = ''

    if (u.isStr(path)) src = path
    else if (u.isStr(resource)) src = resource
    else if (u.isStr(image)) src = image

    // Path emits are handled in resolveActions
    if (u.isStr(src)) {
      if (Identify.reference(src)) {
        if (src.startsWith('..')) {
          // Local
          src = src.substring(2)
          src = get(getRoot()[page.page], src)
        } else if (src.startsWith('.')) {
          // Root
          src = src.substring(1)
          src = get(getRoot(), src)
        }
      }

      if (src) {
        // Wrapping this in a setTimeout allows DOM elements to subscribe
        // their callbacks before this fires
        setTimeout(() => {
          src = n.resolveAssetUrl(src, getAssetsUrl())
          // TODO - Deprecate "src" in favor of data-value
          component.edit({ 'data-src': src })
          path && component.emit('path', src)
          image && component.emit('image', src)
        })
      }
    }
  }

  /* -------------------------------------------------------
    ---- OTHER
  -------------------------------------------------------- */
  // Hardcoding / custom injecting these for now
  if (viewTag) {
    component.edit({ 'data-viewtag': viewTag })
    if (
      /(mainStream|selfStream|subStream|camera|microphone|hangUp|inviteOthers)/i.test(
        viewTag,
      )
    ) {
      component.edit({ 'data-ux': viewTag })
    } else {
      // TODO convert others to use data-view-tag
      component.edit('data-viewtag', viewTag)
      if (!component.get('data-ux')) component.edit({ 'data-ux': viewTag })
    }
  }

  next?.()
})

export default dataAttribsResolver
