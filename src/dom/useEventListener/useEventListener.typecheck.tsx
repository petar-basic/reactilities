// Type-only fixture for `npm run typecheck` (tsconfig.typecheck.json).
// Excluded from the lib build, vitest, and eslint. Its purpose is to FAIL
// type-checking if the target-type widening / event-map generics are reverted.

import { useRef } from "react";
import { useEventListener } from "./index";

export function UseEventListenerTypecheck() {
  // 1) window target — would be rejected by the old narrow type. The event
  //    must be typed as a UIEvent from WindowEventMap.
  useEventListener(window, "resize", (event) => {
    const e: UIEvent = event;
    void e;
  });

  // 2) document target — old type rejected this too. KeyboardEvent from
  //    DocumentEventMap, so `event.key` must be valid.
  useEventListener(document, "keydown", (event) => {
    const key: string = event.key;
    void key;
  });

  // 3) HTMLElement ref target — event typed from HTMLElementEventMap, so a
  //    'click' handler receives a MouseEvent (clientX must exist).
  const ref = useRef<HTMLButtonElement>(null);
  useEventListener(ref, "click", (event) => {
    const x: number = event.clientX;
    void x;
  });

  // 4) Inline options object must still be accepted.
  const scrollRef = useRef<HTMLDivElement>(null);
  useEventListener(scrollRef, "scroll", () => {}, { passive: true, once: true });

  return null;
}
