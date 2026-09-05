'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { SPINE, SECONDARY, WALLET_BALANCE } from '@/lib/data';
import { useAppState } from '@/lib/AppStateContext';
import * as T from '@/lib/theme';

const SB_WIDTH = 272;
const OPEN_SPRING = { type: 'spring', bounce: 0, duration: 0.32 };

export default function Sidebar({ activeId, mobile }) {
  const { navOpen, nav, openGroups, toggleGroup, setNavOpen, theme, toggleTheme } = useAppState();
  const reduced = useReducedMotion();
  const [dragVelocity, setDragVelocity] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDragVelocity(0), 400);
    return () => clearTimeout(t);
  }, [navOpen]);

  const handleDragEnd = (_e, info) => {
    const shouldClose = info.offset.x < -SB_WIDTH * 0.3 || info.velocity.x < -650;
    setDragVelocity(info.velocity.x);
    setNavOpen(!shouldClose);
  };

  const mobileMotionProps = mobile
    ? {
        drag: reduced || !navOpen ? false : 'x',
        dragConstraints: { left: -SB_WIDTH, right: 0 },
        dragElastic: 0.12,
        onDragEnd: handleDragEnd,
        animate: reduced ? { opacity: navOpen ? 1 : 0 } : { x: navOpen ? 0 : -SB_WIDTH },
        transition: dragVelocity ? { type: 'spring', velocity: dragVelocity, bounce: 0.14, duration: 0.32 } : OPEN_SPRING,
      }
    : {};

  const sbStyle = mobile
    ? {
        width: 272, flex: '0 0 0px', background: T.SIDEBAR_NAVY, position: 'fixed', left: 0, top: 0,
        height: '100vh', zIndex: 90, boxShadow: navOpen ? '0 0 60px rgba(8,20,40,.45)' : 'none',
        display: 'flex', flexDirection: 'column', touchAction: 'pan-y',
        pointerEvents: navOpen ? 'auto' : 'none',
      }
    : {
        width: 272, flex: '0 0 272px', background: T.SIDEBAR_NAVY, position: 'sticky', left: 'auto', top: 0,
        height: '100vh', zIndex: 30,
        display: 'flex', flexDirection: 'column',
      };

  const isAdmin = activeId.indexOf('a-') === 0;

  const onDashboard = activeId === 'dashboard';

  return (
    <motion.div style={sbStyle} {...mobileMotionProps}>
      <motion.div
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.1 }}
        onClick={() => nav('dashboard')}
        style={{ height: 52, flex: '0 0 52px', display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', borderBottom: '1px solid rgba(255,255,255,.08)', cursor: 'pointer' }}
      >
        <div style={{ width: 24, height: 24, background: T.ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: '#06212C', clipPath: 'polygon(0 0,100% 0,100% 72%,72% 100%,0 100%)' }}>N</div>
        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '.13em', color: '#fff' }}>NEXGO</div>
        <div style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, letterSpacing: '.09em', color: T.SIDEBAR_LABEL, border: '1px solid rgba(255,255,255,.16)', padding: '2px 5px' }}>
          {isAdmin ? 'ADMIN' : 'SELLER'}
        </div>
      </motion.div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '10px 0 2px' }}>
          <motion.div
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.1 }}
            onClick={() => nav('dashboard')}
            style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, padding: '9px 18px', margin: '0 8px', cursor: 'pointer', background: onDashboard ? 'rgba(0,179,164,.15)' : 'transparent' }}
          >
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: onDashboard ? T.ACCENT : 'transparent' }} />
            <div style={{ width: 8, height: 8, borderRadius: 2, background: onDashboard ? T.ACCENT : '#3A5178' }} />
            <div style={{ fontSize: 14.5, fontWeight: onDashboard ? 600 : 500, color: onDashboard ? '#fff' : '#C7D2E2', letterSpacing: '-.005em' }}>Dashboard</div>
          </motion.div>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: T.SIDEBAR_LABEL, padding: '15px 18px 10px' }}>Shipment lifecycle</div>

        {SPINE.map(([id, label, count, sub, dest, kids], i) => {
          const on = kids.some((k) => k[1] === activeId) || dest === activeId;
          return (
            <div key={id}>
              <div
                onClick={() => nav(dest)}
                style={{ position: 'relative', display: 'flex', gap: 12, padding: '11px 18px', cursor: 'pointer', background: on ? 'rgba(0,179,164,.15)' : 'transparent', borderTop: '1px solid rgba(255,255,255,.05)' }}
              >
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: on ? T.ACCENT : 'transparent' }} />
                <div style={{ flex: '0 0 9px', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4 }}>
                  <div style={{ width: 8, height: 8, background: on ? T.ACCENT : '#3A5178' }} />
                  <div style={{ flex: 1, width: 1, background: 'rgba(255,255,255,.13)', marginTop: 3, minHeight: i === SPINE.length - 1 ? 0 : 12 }} />
                </div>
                <div style={{ flex: 1, minWidth: 0, paddingBottom: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ fontSize: 14.5, fontWeight: on ? 600 : 500, color: on ? '#fff' : '#C7D2E2', letterSpacing: '-.005em' }}>{label}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: on ? '#fff' : T.SIDEBAR_LABEL }}>{count}</div>
                  </div>
                  <div style={{ fontSize: 11.5, color: T.SIDEBAR_SUB, marginTop: 3 }}>{sub}</div>
                </div>
              </div>
              {on && (
                <div style={{ padding: '2px 0 6px', animation: 'nxc-expand .12s ease-out' }}>
                  {kids.map(([l, d]) => (
                    <div
                      key={d}
                      onClick={() => nav(d)}
                      style={{ padding: '8px 18px 8px 39px', fontSize: 13.5, fontWeight: d === activeId ? 600 : 400, color: d === activeId ? '#fff' : '#A7B7CE', background: d === activeId ? 'rgba(255,255,255,.09)' : 'transparent', cursor: 'pointer' }}
                    >
                      {l}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <div style={{ height: 1, background: 'rgba(255,255,255,.1)', margin: '12px 0 0' }} />

        {SECONDARY.map(([label, items]) => {
          const has = items.some((it) => it[1] === activeId);
          const open = openGroups[label] === undefined ? has : !!openGroups[label];
          return (
            <div key={label} style={{ borderBottom: '1px solid rgba(255,255,255,.05)' }}>
              <div
                onClick={() => toggleGroup(label, has)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 18px', cursor: 'pointer', color: T.SIDEBAR_TEXT, fontSize: 14, fontWeight: 500 }}
              >
                <div style={{ fontSize: 8, color: T.SIDEBAR_MUTED, width: 7, transform: open ? 'rotate(90deg)' : 'none' }}>▸</div>
                {label}
                <div style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: T.SIDEBAR_LABEL }}>{items.length}</div>
              </div>
              {open && (
                <div style={{ padding: '0 0 6px', animation: 'nxc-expand .12s ease-out' }}>
                  {items.map(([l, d]) => (
                    <div
                      key={d}
                      onClick={() => nav(d)}
                      style={{ padding: '8px 18px 8px 39px', fontSize: 13.5, fontWeight: d === activeId ? 600 : 400, color: d === activeId ? '#fff' : '#A7B7CE', background: d === activeId ? 'rgba(255,255,255,.09)' : 'transparent', cursor: 'pointer' }}
                    >
                      {l}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,.1)' }}>
        <div style={{ padding: '11px 16px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: T.SIDEBAR_LABEL }}>Wallet</div>
            <div onClick={() => nav('recharges')} style={{ fontSize: 12.5, fontWeight: 600, color: T.ACCENT, cursor: 'pointer' }}>Recharge</div>
          </div>
          <div style={{ fontVariantNumeric: 'tabular-nums', fontSize: 17, fontWeight: 600, color: '#fff', marginTop: 5 }}>{WALLET_BALANCE}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', padding: '10px 18px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          <div style={{ fontSize: 13, color: T.SIDEBAR_TEXT }}>Appearance</div>
          <motion.div
            whileTap={{ scale: 0.94 }}
            transition={{ duration: 0.1 }}
            onClick={toggleTheme}
            style={{
              marginLeft: 'auto', width: 44, height: 24, borderRadius: 12, position: 'relative', cursor: 'pointer',
              background: theme === 'dark' ? 'rgba(0,179,164,.28)' : 'rgba(255,255,255,.1)',
              border: `1px solid ${theme === 'dark' ? T.ACCENT : 'rgba(255,255,255,.16)'}`,
            }}
          >
            <motion.div
              layout
              transition={{ type: 'spring', bounce: 0.2, duration: 0.3 }}
              style={{
                position: 'absolute', top: 2, left: theme === 'dark' ? 22 : 2, width: 18, height: 18, borderRadius: 9,
                background: theme === 'dark' ? T.ACCENT : '#D3DCE9',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10,
              }}
            >
              {theme === 'dark' ? '🌙' : '☀️'}
            </motion.div>
          </motion.div>
        </div>
        <div style={{ display: 'flex' }}>
          <div onClick={() => nav('a-overview')} style={{ flex: 1, padding: '12px 18px', fontSize: 13.5, color: T.SIDEBAR_TEXT, cursor: 'pointer', borderRight: '1px solid rgba(255,255,255,.08)' }}>Admin panel</div>
          <div onClick={() => nav('login')} style={{ flex: '0 0 auto', padding: '12px 18px', fontSize: 13.5, color: T.SIDEBAR_TEXT, cursor: 'pointer' }}>Sign out</div>
        </div>
      </div>
    </motion.div>
  );
}
