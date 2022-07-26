import { graphql, useStaticQuery } from 'gatsby'

function useGetNoodlPages() {
  const { allNoodlPage } = useStaticQuery<{
    allNoodlPage: {
      nodes: {
        name: string
        content: any // string
        slug: string
      }[]
    }
  }>(
    graphql`
      {
        allNoodlPage {
          nodes {
            name
            content
            slug
          }
        }
      }
    `,
  )
  return allNoodlPage
}

export default useGetNoodlPages
