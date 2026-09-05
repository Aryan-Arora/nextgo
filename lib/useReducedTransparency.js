'use client';

import { useEffect, useState } from 'react';

// Mirrors prefers-reduced-motion handling but for translucent materials:
// callers should fall back to a near-solid background and drop the blur.
export function useReducedTransparency() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-transparency: reduce)');
    setReduced(mq.matches);
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}
