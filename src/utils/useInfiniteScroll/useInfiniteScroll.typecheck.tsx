/**
 * Type regression fixture for useInfiniteScroll.
 *
 * Checked by `npm run typecheck` (tsconfig.typecheck.json) but excluded from
 * the build (tsconfig.lib.json), vitest, and eslint.
 *
 * Guards BUG 2: the hook must be generic over the element type so the returned
 * `loaderRef` assigns cleanly to a typed element ref under React 19. If the
 * generic is reverted to a non-generic `RefObject<HTMLElement | null>`, the
 * `<div ref={loaderRef}>` assignment below fails with TS2322 and typecheck breaks.
 */
import { useInfiniteScroll } from './index';

export function InfiniteScrollTypecheckFixture() {
  const { loaderRef, isLoading } = useInfiniteScroll<HTMLDivElement>({
    onLoadMore: () => {},
    hasMore: true,
  });

  // isLoading must be a boolean.
  const _loading: boolean = isLoading;
  void _loading;

  // The returned ref must be assignable to a div's ref without casting.
  return <div ref={loaderRef}>{isLoading ? 'Loading…' : null}</div>;
}

// Default type parameter (HTMLElement) must also typecheck.
export function InfiniteScrollDefaultGenericFixture() {
  const { loaderRef } = useInfiniteScroll({
    onLoadMore: async () => {},
    hasMore: false,
  });

  return <div ref={loaderRef} />;
}
