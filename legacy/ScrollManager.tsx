import React from 'react'
import usePageCtx from './PageContext'

/**
 * This is a global independent component that manages scroll offsets upon page changes
 */
function ScrollManager() {
  const [lastPageHandled, setLastPageHandled] = React.useState('')
  const { page } = usePageCtx()

  React.useEffect(() => {
    // page.object.viewPort === top
    const handleScrollTop = (pageName: string) => {
      if (window.scrollY !== 0) {
        let logMsg = `%c[ScrollManager.tsx][handleScrollTop][useEffect] Scrolling to top because we aren't at the top`
        let logStyle = `color:#00b406;font-weight:bold;`
        console.log(logMsg, logStyle, { page, pageName, lastPageHandled })

        window.scrollTo(0, 0)

        if (pageName) {
          logMsg = `%c[ScrollManager.tsx][handleScrollTop][useEffect] Updated lastPageHandled to: ${pageName}`
          logStyle = `color:#00b406;font-weight:bold;`
          console.log(logMsg, logStyle)

          setLastPageHandled(pageName)
        } else {
          logMsg = `%c[ScrollManager.tsx][handleScrollTop][useEffect] Scrolled to top but could not call setLastPageHandled because pageName was invalid`
          logStyle = `color:#ec0000;font-weight:bold;`
          console.log(logMsg, logStyle, { pageName, page })
        }
      } else {
        const logMsg = `%c[ScrollManager.tsx][handleScrollTop][useEffect] Aborted the call to handleScrollTop because we are already at the top`
        const logStyle = `color:#FF5722;font-weight:bold;`
        console.log(logMsg, logStyle, {
          pageName,
          page,
        })
      }
    }

    // page.object.viewPort === bottom
    const handleScrollBottom = (pageName: string) => {
      const rootHtmlNode = document.documentElement
      const visibleHeight = window.innerHeight
      const totalHeight = rootHtmlNode.scrollHeight
      const expectedScrollPosValue = totalHeight - visibleHeight
      const currentScrollPosValue = document.documentElement.scrollTop
      const isBottom = currentScrollPosValue === expectedScrollPosValue
      if (!isBottom) {
        window.scrollTo(0, totalHeight)

        const logMsg = `%c[ScrollManager.tsx][handleScrollBottom][useEffect] Scrolling to bottom position: ${totalHeight}`
        const logStyle = `color:#63c70f;font-weight:bold;`
        console.log(logMsg, logStyle)

        if (pageName) {
          const logMsg = `%c[ScrollManager.tsx][handleScrollBottom][useEffect] Updated lastPageHandled to: ${pageName}`
          const logStyle = `color:#63c70f;font-weight:bold;`
          console.log(logMsg, logStyle)

          setLastPageHandled(pageName)
        } else {
          const logMsg = `%c[ScrollManager][handleScrollBottom][useEffect] Scrolled to bottom but could not call setLastPageHandled because pageName was invalid`
          const logStyle = `color:#ec0000;font-weight:bold;`
          console.log(logMsg, logStyle, {
            pageName,
            page,
            visibleHeight,
            totalHeight,
            expectedScrollPosValue,
            currentScrollPosValue,
            isBottom,
          })
        }
      } else {
        const logMsg = `%c[ScrollManager.tsx][handleScrollBottom][useEffect] Aborted the call to handleScrollBottom because we are already at the bottom`
        const logStyle = `color:#FF5722;font-weight:bold;`
        console.log(logMsg, logStyle, {
          pageName,
          page,
          visibleHeight,
          totalHeight,
          expectedScrollPosValue,
          currentScrollPosValue,
          isBottom,
        })
      }
    }

    let currentPage = page.name || ''

    // Handle scroll position
    if (currentPage && currentPage !== lastPageHandled) {
      let logMsg = `%c[ScrollManager.tsx][useEffect] Page needs to be checked for viewport handling`
      const logStyle = `color:#63c70f;font-weight:bold;`
      console.log(logMsg, logStyle, { currentPage, lastPageHandled, page })

      if (page.object) {
        logMsg = `%c[ScrollManager.tsx][useEffect] Using page object for page ${page.name}`
        console.log(logMsg, logStyle)

        const viewport = page.object?.viewport || page.object?.viewPort
        // Some pages have a top local root level property called "viewPort" which
        // we have to handle if we haven't yet already
        if (viewport) {
          if (viewport === 'top') {
            logMsg = `%c[ScrollManager.tsx][useEffect] Handling viewport: ${viewport}`
            console.log(logMsg, logStyle)

            return void handleScrollTop(currentPage)
          } else if (viewport === 'bottom') {
            logMsg = `%c[ScrollManager.tsx][useEffect] Handling viewport: ${viewport}`
            console.log(logMsg, logStyle)

            return void handleScrollBottom(currentPage)
          } else if (viewport === 'keep') {
            logMsg = `%c[ScrollManager.tsx][useEffect] Viewport is set to "keep". The scroll position should not be changing`
            console.log(logMsg, logStyle)
            // Do nothing since this is already being done by react-router
            return
          }
        } else {
          const logMsg = `%c[ScrollManager.tsx][useEffect] No viewport was found in the page object`
          const logStyle = `color:#63c70f;font-weight:bold;`
          console.log(logMsg, logStyle, page)
        }
      }
    }

    // Uncomment to start at the top
    // handleScrollTop(currentPage)

    // eslint-disable-next-line
  }, [page])

  return null
}

export default ScrollManager
