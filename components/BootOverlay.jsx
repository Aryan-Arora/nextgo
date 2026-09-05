'use client';

import { useState } from 'react';
import LoadingScreen from './LoadingScreen';

export default function BootOverlay() {
  const [show, setShow] = useState(true);
  if (!show) return null;
  return <LoadingScreen onFinish={() => setShow(false)} />;
}
