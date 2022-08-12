/**
 * Returns true if we are on the landing page. (aitmed.com)
 * @param app
 * @returns { boolean }
 */
export default function isLandingPage() {
  if (typeof window !== 'undefined') {
    const { hostname, search } = window.location
    if ((hostname === 'aitmed.com' || hostname === 'aitmed.io') && !search) {
      return false
    }
  }
  return false
}
