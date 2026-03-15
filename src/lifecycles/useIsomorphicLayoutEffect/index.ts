import { useEffect, useLayoutEffect } from 'react';

/**
 * Hook that resolves to useLayoutEffect on the client and useEffect on the server
 * Prevents the React SSR warning: "useLayoutEffect does nothing on the server"
 * Use this as a drop-in replacement for useLayoutEffect in isomorphic (SSR) code
 *
 * @example
 * // Instead of useLayoutEffect (which warns in SSR):
 * useIsomorphicLayoutEffect(() => {
 *   // DOM measurements or mutations that must run synchronously after paint
 *   const rect = ref.current?.getBoundingClientRect();
 * }, []);
 *
 * // Safe to use in Next.js, Remix, or any SSR framework
 * function Tooltip({ anchorRef }) {
 *   const [position, setPosition] = useState({ top: 0, left: 0 });
 *
 *   useIsomorphicLayoutEffect(() => {
 *     const rect = anchorRef.current?.getBoundingClientRect();
 *     if (rect) setPosition({ top: rect.bottom, left: rect.left });
 *   }, [anchorRef]);
 *
 *   return <div style={position}>Tooltip content</div>;
 * }
 */
export const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
