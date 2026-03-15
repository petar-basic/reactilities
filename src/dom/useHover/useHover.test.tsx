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
});
