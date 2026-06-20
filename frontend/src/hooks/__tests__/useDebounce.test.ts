import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useDebounce } from '../useDebounce';

describe('useDebounce hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('should debounce the value update', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    expect(result.current).toBe('initial');

    // Update the value prop
    rerender({ value: 'updated', delay: 500 });

    // Value should still be 'initial' immediately after rerender
    expect(result.current).toBe('initial');

    // Fast-forward time by 499ms
    act(() => {
      vi.advanceTimersByTime(499);
    });

    // Still 'initial'
    expect(result.current).toBe('initial');

    // Fast-forward the last 1ms
    act(() => {
      vi.advanceTimersByTime(1);
    });

    // Now it should be 'updated'
    expect(result.current).toBe('updated');
  });

  it('should cancel the previous timer if value changes within the delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    // Update value to 'updated1'
    rerender({ value: 'updated1', delay: 500 });

    // Fast-forward 300ms (timer not done)
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe('initial');

    // Update value to 'updated2' before first timer finishes
    rerender({ value: 'updated2', delay: 500 });

    // Fast-forward another 300ms (original 500ms would have finished, but new timer reset it)
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Still initial because the second update reset the timer to 500ms
    expect(result.current).toBe('initial');

    // Fast-forward remaining 200ms of the *second* timer
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Now it should be 'updated2'
    expect(result.current).toBe('updated2');
  });
});
