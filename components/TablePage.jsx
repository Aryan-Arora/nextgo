'use client';

import { motion } from 'motion/react';
import { TABLES, ST } from '@/lib/data';
import { useAppState } from '@/lib/AppStateContext';
import { optionsFor } from '@/lib/filterOptions';
import * as T from '@/lib/theme';
import FilterDropdown from './FilterDropdown';
import ScenicBackdrop from './ScenicBackdrop';

const CARD = {
  position: 'relative',
  background: 'linear-gradient(165deg, var(--nx-glass-1) 0%, var(--nx-glass-2) 100%)',
  backdropFilter: 'blur(18px) saturate(180%)',
  border: '1px solid var(--nx-glass-border)',
  borderRadius: 12,
  boxShadow: '0 1px 1px rgba(15,23,20,.05), 0 10px 28px rgba(15,23,20,.10)',
};
const TAP = { scale: 0.97 };
const TAP_FAST = { duration: 0.08 };

function cell(c, align) {
  const [kind, v, sub] = c;
  const o = { v, sub: sub || '', align, isChip: false, isLink: false, isText: false, font: T.SANS, size: '13px', fw: 500, color: T.TEXT };
  if (kind === 's') {
    const p = ST[v] || ST.Cancelled;
    return { ...o, isChip: true, fg: p[0], bg: p[1], bd: p[2] };
  }
  if (kind === 'l') {
    if (sub) return { ...o, isText: true, font: T.MONO, size: '12.5px', fw: 500, color: '#0E5049' };
    return { ...o, isLink: true };
  }
  const out = { ...o, isText: true };
  if (kind === 'm') { out.font = T.MONO; out.size = '12.5px'; }
  if (kind === 'n') { out.size = '13px'; out.fw = 600; }
  if (kind === 'b') out.fw = 600;
  return out;
}

function rowOpenBehavior(activeId, nav, setDrawerOpen) {
  if (activeId === 'shipments' || activeId === 'a-shipments') return () => nav('ship-detail');
  if (activeId === 'ndr' || activeId === 'a-ndr') return () => setDrawerOpen(true);
  if (activeId === 'orders' || activeId === 'dropship') return () => nav('shipnow');
  return () => {};
}

export default function TablePage({ activeId, mobile }) {
  const { tab, setTab, nav, setDrawerOpen } = useAppState();
  const t = TABLES[activeId];
  if (!t) return null;

  const tabKey = tab[activeId] || (t.tabs && t.tabs[0][0]);
  const onOpenRow = rowOpenBehavior(activeId, nav, setDrawerOpen);
  const miniCols = mobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)';

  return (
    <div style={{ flex: 1, padding: '20px 22px 48px', position: 'relative' }}>
      <ScenicBackdrop />
      <div style={{ position: 'relative', zIndex: 1 }}>
      {t.stats && (
        <div style={{ ...CARD, display: 'grid', gridTemplateColumns: miniCols, marginBottom: 20, overflow: 'hidden' }}>
          {t.stats.map(([label, value, delta, dir, sub], i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.16), duration: 0.28, ease: 'easeOut' }}
              style={{ padding: '14px 16px', borderRight: (i + 1) % (mobile ? 2 : 4) !== 0 ? `1px solid ${T.DIVIDER}` : 'none', borderBottom: i < t.stats.length - (mobile ? 2 : 4) ? `1px solid ${T.DIVIDER}` : 'none' }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: T.TEXT_MUTED }}>{label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, marginTop: 9 }}>
                <div style={{ fontVariantNumeric: 'tabular-nums', fontSize: 24, fontWeight: 600, letterSpacing: '-.02em', lineHeight: 1 }}>{value}</div>
                <div style={{
                  fontSize: 11.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                  color: dir === 'up' ? T.GREEN : dir === 'down' ? T.RED : T.MUTE,
                  background: dir === 'up' ? `${T.GREEN}17` : dir === 'down' ? `${T.RED}17` : `${T.MUTE}17`,
                  padding: '2px 7px', borderRadius: 20,
                }}>{delta}</div>
              </div>
              <div style={{ fontSize: 12, color: T.TEXT_MUTED, marginTop: 7 }}>{sub}</div>
            </motion.div>
          ))}
        </div>
      )}

      <div style={{ ...CARD, overflow: 'hidden' }}>
        {t.tabs && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '0 14px', borderBottom: `1px solid ${T.DIVIDER}`, overflowX: 'auto' }}>
            {t.tabs.map(([label, count]) => {
              const on = tabKey === label;
              return (
                <motion.div
                  key={label}
                  whileTap={{ scale: 0.96 }}
                  transition={{ duration: 0.08 }}
                  onClick={() => setTab(activeId, label)}
                  className="nxc-tab"
                  style={{ position: 'relative', padding: '13px 12px 11px', color: on ? T.TEXT : T.TEXT_SECONDARY, fontSize: 13.5, fontWeight: on ? 600 : 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}
                >
                  {label}
                  <div style={{ fontSize: 11.5, fontWeight: 600, fontVariantNumeric: 'tabular-nums', background: on ? 'rgba(0,179,164,.16)' : T.DIVIDER, color: on ? '#0E5049' : '#6B6659', padding: '1px 6px', borderRadius: 10 }}>{count}</div>
                  {on && (
                    <motion.div
                      layoutId={`tab-underline-${activeId}`}
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
                      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, background: T.ACCENT, borderRadius: 2 }}
                    />
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', background: 'transparent', borderBottom: `1px solid ${T.DIVIDER}`, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, height: 32, background: T.SURFACE, border: `1px solid ${T.INPUT_BORDER}`, borderRadius: 7, padding: '0 11px', minWidth: 250, color: T.TEXT_MUTED, fontSize: 13 }}>
            <div style={{ width: 11, height: 11, border: '1.5px solid #A8A395', borderRadius: '50%' }} />{t.search}
          </div>
          {t.filters.map((label) => (
            <FilterDropdown
              key={label}
              label={label}
              options={optionsFor(label)}
              className="nxc-btn"
              style={{ display: 'flex', alignItems: 'center', gap: 8, height: 32, background: T.SURFACE, border: `1px solid ${T.INPUT_BORDER}`, borderRadius: 7, padding: '0 11px', fontSize: 13, color: T.TEXT_LABEL, cursor: 'pointer', whiteSpace: 'nowrap' }}
            />
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            {t.tools.map((label) => (
              <motion.div key={label} whileTap={TAP} transition={TAP_FAST} className="nxc-btn" style={{ height: 32, display: 'flex', alignItems: 'center', padding: '0 12px', border: `1px solid ${T.INPUT_BORDER}`, borderRadius: 7, background: T.SURFACE, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>{label}</motion.div>
            ))}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: t.min }}>
            <thead>
              <tr style={{ background: 'transparent' }}>
                {t.cols.map(([label, align]) => (
                  <th key={label + align} style={{ padding: '9px 14px', textAlign: align, fontSize: 10.5, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: T.TABLE_HEAD, borderBottom: `1px solid ${T.BORDER}`, whiteSpace: 'nowrap' }}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {t.rows.map((r, ri) => (
                <motion.tr
                  key={ri}
                  onClick={onOpenRow}
                  className="nxc-row"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(ri * 0.03, 0.24), duration: 0.26, ease: 'easeOut' }}
                  style={{ borderBottom: `1px solid ${T.ROW_DIVIDER}`, cursor: 'pointer' }}
                >
                  {r.map((c, ci) => {
                    const d = cell(c, t.cols[ci][1]);
                    return (
                      <td key={ci} style={{ padding: '0 14px', height: 48, textAlign: d.align, whiteSpace: 'nowrap' }}>
                        {d.isChip && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: d.bg, color: d.fg, border: `1px solid ${d.bd}` }}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: d.fg }} />{d.v}
                          </div>
                        )}
                        {d.isLink && <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0E5049' }}>{d.v}</div>}
                        {d.isText && (
                          <>
                            <div style={{ fontFamily: d.font, fontSize: d.size, fontWeight: d.fw, color: d.color, fontVariantNumeric: 'tabular-nums' }}>{d.v}</div>
                            {d.sub && <div style={{ fontSize: 11.5, color: T.TEXT_MUTED, marginTop: 2 }}>{d.sub}</div>}
                          </>
                        )}
                      </td>
                    );
                  })}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: 'transparent', borderTop: `1px solid ${T.DIVIDER}` }}>
          <div style={{ fontSize: 12.5, color: T.TEXT_SECONDARY }}>{t.count}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <motion.div whileTap={TAP} transition={TAP_FAST} className="nxc-btn" style={{ height: 29, padding: '0 10px', display: 'flex', alignItems: 'center', border: `1px solid ${T.INPUT_BORDER}`, borderRadius: 7, background: T.SURFACE, fontSize: 12.5, color: T.TEXT_FAINT, cursor: 'pointer' }}>Prev</motion.div>
            <motion.div whileTap={TAP} transition={TAP_FAST} style={{ height: 29, minWidth: 29, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 7, background: T.NAVY, color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>1</motion.div>
            <motion.div whileTap={TAP} transition={TAP_FAST} className="nxc-btn" style={{ height: 29, minWidth: 29, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${T.INPUT_BORDER}`, borderRadius: 7, background: T.SURFACE, fontSize: 12.5, cursor: 'pointer' }}>2</motion.div>
            <motion.div whileTap={TAP} transition={TAP_FAST} className="nxc-btn" style={{ height: 29, minWidth: 29, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${T.INPUT_BORDER}`, borderRadius: 7, background: T.SURFACE, fontSize: 12.5, cursor: 'pointer' }}>3</motion.div>
            <motion.div whileTap={TAP} transition={TAP_FAST} className="nxc-btn" style={{ height: 29, padding: '0 10px', display: 'flex', alignItems: 'center', border: `1px solid ${T.INPUT_BORDER}`, borderRadius: 7, background: T.SURFACE, fontSize: 12.5, cursor: 'pointer' }}>Next</motion.div>
          </div>
        </div>
      </div>
      </div>
      <style jsx>{`
        .nxc-btn { transition: background 100ms ease-out, border-color 100ms ease-out; }
        .nxc-btn:hover { background: var(--nx-surface-soft); border-color: var(--nx-menu-border); }
        .nxc-tab:hover { color: var(--nx-text); }
        .nxc-row { transition: background 100ms ease-out; }
        .nxc-row:hover { background: rgba(0,179,164,.08); }
      `}</style>
    </div>
  );
}
