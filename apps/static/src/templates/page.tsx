import React from 'react'
import { PageProps } from 'gatsby'
import Seo from '@/components/Seo'
import PageContext from '@/components/PageContext'
import usePage from '@/hooks/usePage'
import * as t from '@/types'

interface NoodlPageTemplateProps extends PageProps {
  pageContext: t.PageContext
}

function NoodlPageTemplate(props: NoodlPageTemplateProps) {
  const page = usePage(props)

  React.useEffect(() => {
    console.log(props)
  }, [])

  return <>{page.components.map(page.render)}</>
}

export default (props: NoodlPageTemplateProps) => (
  <>
    <Seo />
    <PageContext {...props.pageContext}>
      <NoodlPageTemplate {...props} />
    </PageContext>
  </>
)
