import React from 'react'
import { PageProps } from 'gatsby'
import Seo from '@/components/Seo'
import PageContext from '@/components/PageContext'
import usePage from '@/hooks/usePage'
import * as t from '@/types'

interface HomepageProps extends PageProps {
  pageContext: t.PageContext
}

function Homepage(props: HomepageProps) {
  const page = usePage(props)
  console.log(page)

  return <>{page.components.map(page.render)}</>
}

export default (props: HomepageProps) => (
  <>
    <Seo />
    <PageContext {...props.pageContext}>
      <Homepage {...props} />
    </PageContext>
  </>
)
