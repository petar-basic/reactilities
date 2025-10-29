import { useEffect } from "react";

/**
 * Hook for dynamically setting the website favicon
 * Creates or updates the favicon link element in the document head
 * 
 * @param url - URL or path to the favicon image
 * 
 * @example
 * useFavicon('/favicon.ico');
 * 
 * // Dynamic favicon based on state
 * const [isOnline, setIsOnline] = useState(true);
 * useFavicon(isOnline ? '/favicon-online.ico' : '/favicon-offline.ico');
 * 
 * // Using data URLs
 * useFavicon('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg">...</svg>');
 */
export function useFavicon(url: string): void {
  useEffect(() => {
    let link = document.querySelector(`link[rel~="icon"]`)

    if (!link) {
      link = document.createElement("link");
      link.setAttribute("type", "image/x-icon");
      link.setAttribute("rel", "icon");
      link.setAttribute("href", url);
      document.head.appendChild(link);
    } else {
      link.setAttribute("href", url);
    }
  }, [url]);
}