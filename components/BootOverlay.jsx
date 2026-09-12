'use client';

import { useState } from 'react';
import LoadingScreen from './LoadingScreen';

export default function BootOverlay() {
  const [show, setShow] = useState(true);
  // The same NEXGO entry sequence leads every workspace: the brand resolves
  // first, then authentication decides which console opens next.
  if (!show) return null;
  return <LoadingScreen onFinish={() => setShow(false)} />;
}
