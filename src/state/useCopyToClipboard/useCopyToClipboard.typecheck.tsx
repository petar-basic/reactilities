/**
 * Compile-time (type-only) fixture for useCopyToClipboard — NOT a runtime test.
 *
 * Checked by `tsconfig.typecheck.json` (`npm run typecheck`), excluded from the
 * lib build (so it never reaches dist) and from vitest/eslint.
 *
 * This probe pins down the public return-tuple contract:
 *   1. The tuple is `[string | null, (value: string) => Promise<boolean>]`.
 *   2. The copy function returns a thenable that resolves to a boolean, so
 *      `const ok: boolean = await copy('x')` compiles. If the return type is
 *      ever reverted to `void` (fire-and-forget), `await` yields `void` and the
 *      `boolean` assignment below stops compiling — `npm run typecheck` fails.
 */
import { useCopyToClipboard } from './index';

export async function CopyToClipboardTypeProbe() {
  const [copiedValue, copy] = useCopyToClipboard();

  // copiedValue is the documented string | null.
  const value: string | null = copiedValue;
  void value;

  // copy must be awaitable and resolve to a boolean success flag.
  const ok: boolean = await copy('x');
  void ok;

  // The Promise itself is typed Promise<boolean> (no await).
  const pending: Promise<boolean> = copy('y');
  void pending;
}
