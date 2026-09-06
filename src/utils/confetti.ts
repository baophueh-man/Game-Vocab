import confetti from 'canvas-confetti';

export function isReduceMotionEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const saved = localStorage.getItem('vocagame_reduce_motion');
    if (saved !== null) {
      return saved === 'true';
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * Fires confetti effect unless Reduce Motion / Low-spec mode is enabled.
 * Helps prevent severe frame drops, UI freezes, and stutter on low-end machines.
 */
export function fireConfetti(options?: confetti.Options): void {
  if (isReduceMotionEnabled()) {
    return;
  }
  try {
    confetti(options);
  } catch (err) {
    console.warn('Could not fire confetti:', err);
  }
}

export default fireConfetti;
