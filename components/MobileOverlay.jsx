'use client';

import { motion, AnimatePresence } from 'motion/react';
import { useAppState } from '@/lib/AppStateContext';
import { useReducedTransparency } from '@/lib/useReducedTransparency';

export default function MobileOverlay({ mobile }) {
  const { navOpen, setNavOpen } = useAppState();
  const reducedTransparency = useReducedTransparency();

  return (
    <AnimatePresence>
      {mobile && navOpen && (
        <motion.div
          onClick={() => setNavOpen(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 85,
            background: reducedTransparency ? 'rgba(13,16,14,.86)' : 'rgba(15,23,20,.4)',
            backdropFilter: reducedTransparency ? 'none' : 'blur(6px)',
          }}
        />
      )}
    </AnimatePresence>
  );
}
