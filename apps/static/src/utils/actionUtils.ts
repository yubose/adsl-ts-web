export async function handleSamePageScroll(
  navigate: (to: string) => Promise<void>,
  destination: string,
) {
  // TODO - Handle goto scrolls when navigating to a different page
  let scrollingTo = destination

  if (destination.startsWith('^')) {
    scrollingTo = destination.substring(1)
    destination = destination.substring(1)
  }

  const scrollToElem = document.querySelector(`[data-viewtag=${scrollingTo}]`)

  if (scrollToElem) {
    scrollToElem.id = scrollingTo
    scrollToElem.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
    })
  } else {
    await navigate(`/${destination}/index.html`)
  }
}
