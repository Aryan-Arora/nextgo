'use client';

import { motion } from 'motion/react';
import { PAGES } from '@/lib/data';
import { useAppState } from '@/lib/AppStateContext';
import * as T from '@/lib/theme';

const TAP = { scale: 0.94 };
const TAP_TRANSITION = { duration: 0.1 };

export default function TopBar({ activeId, mobile }) {
  const { navOpen, setNavOpen, setPaletteOpen } = useAppState();
  const meta = PAGES[activeId] || ['', ''];
  const crumb = meta[0], pageTitle = meta[1];

  return (
    <div style={{ height: 52, flex: '0 0 52px', background: T.NAVY, display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px', position: 'sticky', top: 0, zIndex: 40 }}>
      {mobile ? (
        <>
          <motion.div
            whileTap={TAP}
            transition={TAP_TRANSITION}
            onClick={() => setNavOpen(!navOpen)}
            style={{ width: 32, height: 32, flex: '0 0 32px', background: 'rgba(255,255,255,.09)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3.5, cursor: 'pointer' }}
          >
            <div style={{ width: 14, height: 1.6, background: '#DCE4EF' }} />
            <div style={{ width: 14, height: 1.6, background: '#DCE4EF' }} />
            <div style={{ width: 14, height: 1.6, background: '#DCE4EF' }} />
          </motion.div>
          <motion.div
            whileTap={TAP}
            transition={TAP_TRANSITION}
            onClick={() => setPaletteOpen(true)}
            style={{ flex: 1, height: 30, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.09)', display: 'flex', alignItems: 'center', gap: 9, padding: '0 10px', cursor: 'pointer', color: '#8FA2C0', fontSize: 12 }}
          >
            <div style={{ fontFamily: T.MONO, fontSize: 10, fontWeight: 600, color: '#B9C8DE', border: '1px solid rgba(255,255,255,.18)', padding: '1px 4px' }}>⌘K</div>
            Search or run a command
          </motion.div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, flex: '0 0 auto' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: T.SIDEBAR_LABEL }}>{crumb}</div>
            <div style={{ color: '#3A5178' }}>/</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', letterSpacing: '-.01em' }}>{pageTitle}</div>
          </div>
          <motion.div
            whileTap={TAP}
            transition={TAP_TRANSITION}
            onClick={() => setPaletteOpen(true)}
            style={{ flex: 1, maxWidth: 520, margin: '0 auto', height: 30, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.09)', display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px', cursor: 'pointer', color: '#8FA2C0', fontSize: 12 }}
          >
            <div style={{ fontFamily: T.MONO, fontSize: 10, fontWeight: 600, color: '#B9C8DE', border: '1px solid rgba(255,255,255,.18)', padding: '1px 4px' }}>⌘K</div>
            Run a command, jump to a screen, or paste an AWB
          </motion.div>
          <div style={{ display: 'flex', alignItems: 'center', flex: '0 0 auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', padding: '0 14px', borderRight: '1px solid rgba(255,255,255,.1)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: T.SIDEBAR_FAINT }}>Exceptions</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                <div style={{ width: 5, height: 5, background: '#C0392B' }} />
                <div style={{ fontVariantNumeric: 'tabular-nums', fontSize: 13.5, fontWeight: 600, color: '#fff' }}>158</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 14 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', lineHeight: 1.2 }}>Anita Rao</div>
                <div style={{ fontSize: 10.5, color: T.SIDEBAR_MUTED }}>Karma Living · Owner</div>
              </div>
              <div style={{ width: 27, height: 27, background: T.ACCENT, color: '#06212C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>AR</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
