/**
 * Compile-time (type-only) fixture for useImageLazyLoad — NOT a runtime test.
 *
 * Checked by `tsconfig.typecheck.json` (`npm run typecheck`), excluded from the
 * lib build, vitest and eslint. BUG 2's fix swaps the plain
 * `useRef<HTMLImageElement>(null)` for a state-backed RefObject-compatible
 * handle. This fixture guards the public return shape: the returned `ref` must
 * still attach to a concrete `<img ref={ref} />` (assignable to
 * `RefObject<HTMLImageElement | null>`), and `src`/`status`/`isLoaded` must keep
 * their types. If the handle is mistyped (e.g. `RefObject<HTMLElement>`),
 * attaching it to `<img>` stops compiling under @types/react 19 (TS2322) and
 * `npm run typecheck` fails.
 */
import type { RefObject } from 'react';
import { useImageLazyLoad } from './index';

export function ImageLazyLoadTypeProbe() {
  const { ref, src, status, isLoaded } = useImageLazyLoad('/real.jpg', {
    placeholder: '/placeholder.jpg',
    threshold: 0.5,
    rootMargin: '200px',
  });

  // Public return-shape assertions.
  const _ref: RefObject<HTMLImageElement | null> = ref;
  const _src: string = src;
  const _status: 'idle' | 'loading' | 'loaded' | 'error' = status;
  const _isLoaded: boolean = isLoaded;
  void _ref;
  void _src;
  void _status;
  void _isLoaded;

  // The ref must attach to a real <img> element.
  return <img ref={ref} src={src} alt="probe" />;
}
