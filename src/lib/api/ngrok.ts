/**
 * Ngrok free tier may inject an HTML interstitial on browser requests unless this header is set.
 * See: https://ngrok.com/docs/guides/device-gateway/client/ngrok-free-tier
 */
export function ngrokSkipBrowserWarningHeaders(): Record<string, string> {
  const base = import.meta.env.VITE_API_BASE_URL ?? ''
  if (typeof base === 'string' && base.includes('ngrok')) {
    return { 'ngrok-skip-browser-warning': '69420' }
  }
  return {}
}
