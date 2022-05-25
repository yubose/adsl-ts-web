import React from 'react'
import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import * as nu from 'noodl-utils'
import BaseCSS from '@/static/BaseCSS.json'
import BaseDataModel from '@/static/BaseDataModel.json'
import BasePage from '@/static/BasePage.json'
import cadlEndpoint from '@/static/cadlEndpoint.json'
import www from '@/static/www.json'
import HaAbdominalPainInChildrenJson from '@/static/HaAbdominalPainInChildren.json'
import HomePageJson from '@/static/HomePage.json'

const { HaAbdominalPainInChildren } = HaAbdominalPainInChildrenJson
const { HomePage } = HomePageJson

function Introspection() {
  React.useEffect(() => {
    console.log(HaAbdominalPainInChildren)
  }, [])

  return null
}

export default Introspection
