'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { PAGES, ACTIONS } from '@/lib/data';
import { useAppState } from '@/lib/AppStateContext';
import * as T from '@/lib/theme';
import KpiDropdown from './KpiDropdown';
import FilterDropdown from './FilterDropdown';

const TAP = { scale: 0.96 };
const TAP_FAST = { duration: 0.08 };

function formatAgo(seconds) {
  if (seconds < 5) return 'synced just now';
  if (seconds < 60) return `synced ${seconds}s ago`;
  const m = Math.floor(seconds / 60), s = seconds % 60;
  return `synced ${m}m ${s}s ago`;
}

function LiveSync() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      Thu 03 Sep 2026 · 09:42 IST ·
      <span style={{ position: 'relative', width: 6, height: 6, display: 'inline-flex' }}>
        <span className="nxc-live-ping" style={{ position: 'absolute', inset: 0, borderRadius: 4, background: T.GREEN }} />
        <span style={{ position: 'relative', width: 6, height: 6, borderRadius: 4, background: T.GREEN }} />
      </span>
      {formatAgo(seconds)}
    </div>
  );
}

export default function PageHeader({ activeId, isDashboard, mobile }) {
  const { nav, setPaletteOpen } = useAppState();
  const meta = PAGES[activeId] || ['', '', ''];
  const [crumb, pageTitle, pageSub] = meta;
  const isAdmin = activeId.indexOf('a-') === 0;
  const actions = ACTIONS[activeId] || [];

  const headline = isAdmin
    ? '1,284 sellers on the platform. 93.8% blended delivery rate, and 18,642 shipments carry an open exception.'
    : '12,480 orders this cycle, 94.6% delivered, and 158 shipments need a decision today.';

  return (
    <div style={{ background: T.PANEL, borderBottom: `1px solid ${T.BORDER}`, padding: '18px 22px 0', position: 'sticky', top: 52, zIndex: 30 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
        {isDashboard ? (
          <div style={{ maxWidth: 660 }}>
            <div style={{ fontFamily: T.MONO, fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: T.TEXT_MUTED }}><LiveSync /></div>
            <div style={{ fontSize: 23, fontWeight: 600, letterSpacing: '-.025em', marginTop: 9, lineHeight: 1.3 }}>{headline}</div>
          </div>
        ) : (
          <div style={{ maxWidth: 660 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: T.TEXT_MUTED }}>{crumb}</div>
            <div style={{ fontSize: 23, fontWeight: 600, letterSpacing: '-.02em', marginTop: 8, lineHeight: 1.2 }}>{pageTitle}</div>
            <div style={{ fontSize: 13.5, color: T.TEXT_SECONDARY, marginTop: 7, lineHeight: 1.5 }}>{pageSub}</div>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 8, paddingBottom: 16 }}>
          {actions.map(([label, primary, dest], i) => (
            <motion.div
              key={i}
              whileTap={TAP}
              transition={TAP_FAST}
              onClick={() => { if (dest) nav(dest); }}
              className={primary ? '' : 'nxc-btn'}
              style={{ height: 32, padding: '0 13px', borderRadius: 7, border: `1px solid ${primary ? T.NAVY : T.INPUT_BORDER}`, background: primary ? T.NAVY : T.SURFACE, color: primary ? '#fff' : T.TEXT, display: 'flex', alignItems: 'center', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
            >
              {label}
            </motion.div>
          ))}
          {isDashboard && (
            <>
              <KpiDropdown mobile={mobile} />
              <FilterDropdown
                label="Last 30 days"
                options={['Today', 'Last 7 days', 'Last 30 days', 'Last 90 days', 'Custom range']}
                className="nxc-btn"
                align="right"
                style={{ height: 32, padding: '0 12px', borderRadius: 7, border: `1px solid ${T.INPUT_BORDER}`, background: T.SURFACE, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12.5, color: T.TEXT_LABEL }}
              />
            </>
          )}
          <motion.div
            whileTap={TAP}
            transition={TAP_FAST}
            onClick={() => setPaletteOpen(true)}
            style={{ height: 32, padding: '0 13px', borderRadius: 7, background: T.NAVY, color: '#fff', display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', fontSize: 13, fontWeight: 600, boxShadow: '0 6px 16px rgba(15,31,61,.22)' }}
          >
            Ship now
            <div style={{ fontFamily: T.MONO, fontSize: 10, border: '1px solid rgba(255,255,255,.28)', borderRadius: 4, padding: '1px 4px' }}>S</div>
          </motion.div>
        </div>
      </div>
      <style jsx>{`
        .nxc-btn { transition: background 100ms ease-out, border-color 100ms ease-out; }
        .nxc-btn:hover { background: var(--nx-surface-soft); border-color: var(--nx-menu-border); }
      `}</style>
    </div>
  );
}
