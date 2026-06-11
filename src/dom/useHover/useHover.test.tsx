import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { useHover } from './index';

function HoverTarget({ onChange }: { onChange: (v: boolean) => void }) {
  const [ref, isHovered] = useHover<HTMLDivElement>();
  onChange(isHovered);
  return <div ref={ref} data-testid="target">hover me</div>;
}

describe('useHover', () => {
  it('should return false initially', () => {
    const onChange = vi.fn();
    render(<HoverTarget onChange={onChange} />);
    expect(onChange).toHaveBeenLastCalledWith(false);
  });

  it('should return a ref object', () => {
    const { result } = renderHook(() => useHover());
    expect(result.current[0]).toHaveProperty('current');
  });

  it('should set isHovered to true on mouseenter', () => {
    const onChange = vi.fn();
    render(<HoverTarget onChange={onChange} />);
    fireEvent.mouseEnter(screen.getByTestId('target'));
    expect(onChange).toHaveBeenLastCalledWith(true);
  });

  it('should set isHovered to false on mouseleave', () => {
    const onChange = vi.fn();
    render(<HoverTarget onChange={onChange} />);
    fireEvent.mouseEnter(screen.getByTestId('target'));
    expect(onChange).toHaveBeenLastCalledWith(true);
    fireEvent.mouseLeave(screen.getByTestId('target'));
    expect(onChange).toHaveBeenLastCalledWith(false);
  });

  it('should toggle hover on repeated enter/leave', () => {
    const onChange = vi.fn();
    render(<HoverTarget onChange={onChange} />);
    const el = screen.getByTestId('target');

    fireEvent.mouseEnter(el);
    expect(onChange).toHaveBeenLastCalledWith(true);

    fireEvent.mouseLeave(el);
    expect(onChange).toHaveBeenLastCalledWith(false);

    fireEvent.mouseEnter(el);
    expect(onChange).toHaveBeenLastCalledWith(true);
  });

  it('should handle null ref gracefully', () => {
    const { result } = renderHook(() => useHover());
    expect(result.current[0].current).toBeNull();
    expect(result.current[1]).toBe(false);
  });

  // --- Mutation-proof regression tests ---

  it('attaches listeners to a target rendered conditionally after mount', () => {
    const onChange = vi.fn();

    function LateTarget() {
      const [ref, isHovered] = useHover<HTMLDivElement>();
      const [show, setShow] = React.useState(false);
      onChange(isHovered);
      return (
        <>
          <button data-testid="reveal" onClick={() => setShow(true)}>
            reveal
          </button>
          {show && (
            <div ref={ref} data-testid="late-target">
              hover me
            </div>
          )}
        </>
      );
    }

    render(<LateTarget />);
    // Target is not in the DOM yet.
    expect(screen.queryByTestId('late-target')).toBeNull();

    // Flip the state so the target mounts and the callback ref runs.
    fireEvent.click(screen.getByTestId('reveal'));
    const target = screen.getByTestId('late-target');

    // With the old `[]`-deps / read-ref-once effect, listeners were never
    // attached to the late element and this stays false forever.
    fireEvent.mouseEnter(target);
    expect(onChange).toHaveBeenLastCalledWith(true);

    fireEvent.mouseLeave(target);
    expect(onChange).toHaveBeenLastCalledWith(false);
  });

  it('resets isHovered to false when the hovered element is removed', () => {
    const onChange = vi.fn();

    function RemovableTarget() {
      const [ref, isHovered] = useHover<HTMLDivElement>();
      const [show, setShow] = React.useState(true);
      onChange(isHovered);
      return (
        <>
          <button data-testid="remove" onClick={() => setShow(false)}>
            remove
          </button>
          {show && (
            <div ref={ref} data-testid="removable-target">
              hover me
            </div>
          )}
        </>
      );
    }

    render(<RemovableTarget />);
    const target = screen.getByTestId('removable-target');

    fireEvent.mouseEnter(target);
    expect(onChange).toHaveBeenLastCalledWith(true);

    // Remove the hovered node. The detached node never fires `mouseleave`, so
    // the old code left isHovered stuck at true. The fix resets it.
    fireEvent.click(screen.getByTestId('remove'));
    expect(screen.queryByTestId('removable-target')).toBeNull();
    expect(onChange).toHaveBeenLastCalledWith(false);
  });

  it('resets isHovered to false when the hovered element is replaced', () => {
    const onChange = vi.fn();

    function ReplaceableTarget() {
      const [ref, isHovered] = useHover<HTMLDivElement>();
      const [variant, setVariant] = React.useState<'a' | 'b'>('a');
      onChange(isHovered);
      return (
        <>
          <button data-testid="swap" onClick={() => setVariant('b')}>
            swap
          </button>
          {variant === 'a' ? (
            <div key="a" ref={ref} data-testid="target-a">
              a
            </div>
          ) : (
            <div key="b" ref={ref} data-testid="target-b">
              b
            </div>
          )}
        </>
      );
    }

    render(<ReplaceableTarget />);
    const first = screen.getByTestId('target-a');

    fireEvent.mouseEnter(first);
    expect(onChange).toHaveBeenLastCalledWith(true);

    // Replace the hovered node with a different one (distinct key/element).
    fireEvent.click(screen.getByTestId('swap'));
    expect(screen.queryByTestId('target-a')).toBeNull();

    // Hover state must not carry over to the new element.
    expect(onChange).toHaveBeenLastCalledWith(false);

    // The new element must have working listeners too.
    fireEvent.mouseEnter(screen.getByTestId('target-b'));
    expect(onChange).toHaveBeenLastCalledWith(true);
  });

  it('keeps the same ref identity across renders', () => {
    const { result, rerender } = renderHook(() => useHover<HTMLDivElement>());
    const firstRef = result.current[0];
    rerender();
    expect(result.current[0]).toBe(firstRef);
  });
});
