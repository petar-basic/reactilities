/**
 * Configuration object for loading scripts
 */
interface LoadScriptProps {
  /** HTML script element properties to set on the created script tag */
  scriptProps: Partial<HTMLScriptElement>;
  /** Inline JavaScript code to execute */
  inlineScript: string;
}

/**
 * Dynamically loads and executes JavaScript code by creating a script element
 * Useful for loading analytics, tracking scripts, or third-party libraries
 *
 * @param config - Configuration object containing script properties and inline code
 * @param config.scriptProps - HTML attributes to set on the script element (e.g., async, defer, type)
 * @param config.inlineScript - JavaScript code to execute inline
 *
 * @example
 * // Load Google Tag Manager
 * const GOOGLE_TAG_MANAGER = {
 *   scriptProps: {},
 *   inlineScript: `
 *     (function (w, d, s, l, i) {
 *       w[l] = w[l] || [];
 *       w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
 *       var f = d.getElementsByTagName(s)[0],
 *         j = d.createElement(s),
 *         dl = l != 'dataLayer' ? '&l=' + l : '';
 *       j.async = true;
 *       j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
 *       f.parentNode.insertBefore(j, f);
 *     })(window, document, 'script', 'dataLayer', 'GTM-KEY');
 *   `,
 * };
 *
 * // Load before React app initialization
 * const root = ReactDOM.createRoot(
 *   document.getElementById('root') as HTMLElement
 * );
 *
 * loadScript(GOOGLE_TAG_MANAGER);
 *
 * root.render(
 *   <StrictMode>
 *     <RouterProvider router={router} />
 *   </StrictMode>
 * );
 *
 * @example
 * // Load external script with attributes
 * loadScript({
 *   scriptProps: {
 *     src: 'https://cdn.example.com/analytics.js',
 *     async: true,
 *     defer: true
 *   },
 *   inlineScript: ''
 * });
 *
 * @example
 * // Load inline analytics code
 * loadScript({
 *   scriptProps: { type: 'text/javascript' },
 *   inlineScript: `
 *     window.analytics = window.analytics || [];
 *     analytics.track('page_view', { page: window.location.pathname });
 *   `
 * });
 */
export const loadScript = ({
  scriptProps,
  inlineScript
}: LoadScriptProps): void => {
  const script = document.createElement('script');

  // Boolean IDL attributes (async, defer, noModule) must be handled with care:
  // setAttribute cannot remove an attribute, so setting async: false would still
  // make the script async because the attribute is present regardless of its value.
  // Use removeAttribute for false booleans; setAttribute for everything else.
  for (const [key, value] of Object.entries(scriptProps)) {
    if (typeof value === 'boolean') {
      if (value) {
        script.setAttribute(key, String(value));
      } else {
        script.removeAttribute(key);
      }
    } else if (value !== undefined && value !== null) {
      script.setAttribute(key, String(value));
    }
  }
  script.text = inlineScript;

  document.getElementsByTagName('head')[0].appendChild(script);
};
