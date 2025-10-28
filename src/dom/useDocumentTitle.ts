import { useEffect } from "react";

/**
 * Hook for dynamically setting the document title
 * Updates the browser tab title whenever the title parameter changes
 * 
 * @param title - The title to set for the document
 * 
 * @example
 * useDocumentTitle('My App - Dashboard');
 * 
 * // Dynamic title based on state
 * const [user, setUser] = useState(null);
 * useDocumentTitle(user ? `Welcome ${user.name}` : 'Login');
 */
export default function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = title;
  }, [title])
}