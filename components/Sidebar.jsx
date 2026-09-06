'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { SPINE, SECONDARY, WALLET_BALANCE } from '@/lib/data';
import { useAppState } from '@/lib/AppStateContext';
import * as T from '@/lib/theme';

const SB_WIDTH = 272;
const OPEN_SPRING = { type: 'spring', bounce: 0, duration: 0.32 };

const ICONS = {
  dashboard: 'M4 11.5 12 4l8 7.5v8a.5.5 0 0 1-.5.5h-15a.5.5 0 0 1-.5-.5v-7.5ZM9 19.5v-5h6v5',
  intake: 'M4 6.5h16M4 12h16M4 17.5h11M6 4v4M17 9.5v4M13 15v4',
  book: 'M5 5.5h14v13H5zM8 9h8M8 13h5M16.5 17.5l2 2 3-4',
  flight: 'M4 12h16M12 4v16M6.5 6.5l11 11M17.5 6.5l-11 11',
  exceptions: 'M12 4.5 20 19H4L12 4.5ZM12 9v4.5M12 16.3v.2',
  money: 'M5 7h14v10H5zM8 12h8M12 9.5v5',
};

function NavIcon({ name, active }) {
  return (
    <div style={{ width: 29, height: 29, flex: '0 0 29px', borderRadius: 8, display: 'grid', placeItems: 'center', color: active ? '#D8FFFA' : '#8DA2C2', background: active ? 'rgba(0,179,164,.17)' : 'rgba(255,255,255,.045)', border: `1px solid ${active ? 'rgba(75,220,205,.26)' : 'rgba(255,255,255,.055)'}` }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICONS[name] || ICONS.dashboard} /></svg>
    </div>
  );
}

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
        width: 272, flex: '0 0 0px', background: 'linear-gradient(180deg, #102445 0%, #0B1B36 48%, #09162B 100%)', position: 'fixed', left: 0, top: 0,
        height: '100vh', zIndex: 90, boxShadow: navOpen ? '0 0 60px rgba(8,20,40,.45)' : 'none',
        display: 'flex', flexDirection: 'column', touchAction: 'pan-y',
        pointerEvents: navOpen ? 'auto' : 'none',
      }
    : {
        width: 272, flex: '0 0 272px', background: 'linear-gradient(180deg, #102445 0%, #0B1B36 48%, #09162B 100%)', position: 'sticky', left: 'auto', top: 0,
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
        style={{ height: 68, flex: '0 0 68px', display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', borderBottom: '1px solid rgba(255,255,255,.08)', cursor: 'pointer', background: 'linear-gradient(90deg, rgba(255,255,255,.035), transparent)' }}
      >
        <div style={{ width: 31, height: 31, background: 'linear-gradient(145deg, #35D5C5, #00A99C)', boxShadow: '0 8px 18px rgba(0,179,164,.24)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: '#06212C', borderRadius: 9, clipPath: 'polygon(0 0,100% 0,100% 72%,72% 100%,0 100%)' }}>N</div>
        <div style={{ minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 750, letterSpacing: '.13em', color: '#fff', lineHeight: 1 }}>NEXGO</div><div style={{ marginTop: 5, fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', color: '#7F96B9' }}>Shipping OS</div></div>
        <div style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 800, letterSpacing: '.1em', color: '#A9F0E7', background: 'rgba(0,179,164,.11)', border: '1px solid rgba(80,221,204,.2)', padding: '3px 6px', borderRadius: 5 }}>
          {isAdmin ? 'ADMIN' : 'SELLER'}
        </div>
      </motion.div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '14px 10px 5px' }}>
          <div style={{ padding: '0 8px 8px', fontSize: 9.5, fontWeight: 800, letterSpacing: '.13em', textTransform: 'uppercase', color: '#6F87AA' }}>Workspace</div>
          <motion.div
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.1 }}
            onClick={() => nav('dashboard')}
            className="nxc-nav-row"
            style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 9px', borderRadius: 10, cursor: 'pointer', background: onDashboard ? 'linear-gradient(90deg, rgba(0,179,164,.19), rgba(0,179,164,.06))' : undefined, border: `1px solid ${onDashboard ? 'rgba(73,220,204,.16)' : 'transparent'}` }}
          >
            {onDashboard && <div style={{ position: 'absolute', left: -1, top: 9, bottom: 9, width: 3, borderRadius: 3, background: T.ACCENT, boxShadow: '0 0 12px rgba(0,179,164,.6)' }} />}
            <NavIcon name="dashboard" active={onDashboard} />
            <div style={{ fontSize: 13.5, fontWeight: onDashboard ? 700 : 550, color: onDashboard ? '#fff' : '#C7D2E2', letterSpacing: '-.005em' }}>Dashboard</div>
          </motion.div>
        </div>
        <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.13em', textTransform: 'uppercase', color: '#6F87AA', padding: '17px 18px 9px' }}>Shipment lifecycle</div>

        {SPINE.map(([id, label, count, sub, dest, kids], i) => {
          const on = kids.some((k) => k[1] === activeId) || dest === activeId;
          return (
            <div key={id} style={{ padding: '2px 8px 0' }}>
              <div
                onClick={() => nav(dest)}
                className="nxc-nav-row"
                style={{ position: 'relative', display: 'flex', gap: 10, padding: '8px 9px', borderRadius: 10, cursor: 'pointer', background: on ? 'linear-gradient(90deg, rgba(0,179,164,.19), rgba(0,179,164,.06))' : undefined, border: `1px solid ${on ? 'rgba(73,220,204,.16)' : 'transparent'}` }}
              >
                {on && <div style={{ position: 'absolute', left: -1, top: 9, bottom: 9, width: 3, borderRadius: 3, background: T.ACCENT, boxShadow: '0 0 12px rgba(0,179,164,.6)' }} />}
                <NavIcon name={id} active={on} />
                <div style={{ flex: 1, minWidth: 0, padding: '1px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ fontSize: 13.5, fontWeight: on ? 700 : 550, color: on ? '#fff' : '#C7D2E2', letterSpacing: '-.005em' }}>{label}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: on ? '#BFF9F1' : '#8499B7', background: on ? 'rgba(0,179,164,.12)' : 'rgba(255,255,255,.035)', padding: '2px 6px', borderRadius: 5 }}>{count}</div>
                  </div>
                  <div style={{ fontSize: 10.5, color: T.SIDEBAR_SUB, marginTop: 3 }}>{sub}</div>
                </div>
              </div>
              {on && (
                <div style={{ margin: '3px 0 7px 23px', padding: '2px 0 3px 14px', borderLeft: '1px solid rgba(139,164,199,.22)', animation: 'nxc-expand .12s ease-out' }}>
                  {kids.map(([l, d]) => (
                    <div
                      key={d}
                      onClick={() => nav(d)}
                      className="nxc-nav-row"
                      style={{ padding: '7px 10px', borderRadius: 7, margin: '1px 0', fontSize: 12.5, fontWeight: d === activeId ? 650 : 450, color: d === activeId ? '#D9FFFA' : '#A7B7CE', background: d === activeId ? 'rgba(0,179,164,.13)' : undefined, cursor: 'pointer' }}
                    >
                      {l}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.15), transparent)', margin: '14px 16px 8px' }} />

        {SECONDARY.map(([label, items]) => {
          const has = items.some((it) => it[1] === activeId);
          const open = openGroups[label] === undefined ? has : !!openGroups[label];
          return (
            <div key={label} style={{ padding: '0 8px' }}>
              <div
                onClick={() => toggleGroup(label, has)}
                className="nxc-nav-row"
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 9, cursor: 'pointer', color: T.SIDEBAR_TEXT, fontSize: 12.5, fontWeight: 600 }}
              >
                <div style={{ fontSize: 8, color: T.SIDEBAR_MUTED, width: 7, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .18s ease' }}>▸</div>
                {label}
                <div style={{ marginLeft: 'auto', fontSize: 10.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: T.SIDEBAR_LABEL, background: 'rgba(255,255,255,.045)', padding: '2px 5px', borderRadius: 4 }}>{items.length}</div>
              </div>
              {open && (
                <div style={{ margin: '0 0 7px 20px', paddingLeft: 11, borderLeft: '1px solid rgba(139,164,199,.18)', animation: 'nxc-expand .12s ease-out' }}>
                  {items.map(([l, d]) => (
                    <div
                      key={d}
                      onClick={() => nav(d)}
                      className="nxc-nav-row"
                      style={{ padding: '7px 10px', borderRadius: 7, margin: '1px 0', fontSize: 12.5, fontWeight: d === activeId ? 650 : 450, color: d === activeId ? '#D9FFFA' : '#A7B7CE', background: d === activeId ? 'rgba(0,179,164,.13)' : undefined, cursor: 'pointer' }}
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

      <div style={{ padding: '10px 10px 11px', borderTop: '1px solid rgba(255,255,255,.1)', background: 'rgba(2,11,27,.18)' }}>
        <div style={{ padding: '11px 12px', borderRadius: 11, background: 'linear-gradient(135deg, rgba(0,179,164,.16), rgba(41,77,126,.18))', border: '1px solid rgba(111,219,207,.15)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: '#9CCAC7' }}>Available wallet</div>
            <div onClick={() => nav('recharges')} style={{ fontSize: 11, fontWeight: 700, color: '#D0FFFA', cursor: 'pointer', background: 'rgba(0,179,164,.16)', padding: '4px 7px', borderRadius: 6 }}>Add funds</div>
          </div>
          <div style={{ fontVariantNumeric: 'tabular-nums', fontSize: 19, fontWeight: 700, letterSpacing: '-.025em', color: '#fff', marginTop: 7 }}>{WALLET_BALANCE}</div>
          <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: '#A4C5D1' }}><span style={{ width: 5, height: 5, borderRadius: 5, background: '#58DBC9', boxShadow: '0 0 0 3px rgba(88,219,201,.12)' }} />Updated just now</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 8px 10px' }}>
          <div><div style={{ fontSize: 11.5, color: T.SIDEBAR_TEXT, fontWeight: 600 }}>Interface mode</div><div style={{ marginTop: 2, fontSize: 10, color: T.SIDEBAR_MUTED }}>{theme === 'dark' ? 'Dark contrast' : 'Light contrast'}</div></div>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 7px 0', borderTop: '1px solid rgba(255,255,255,.06)' }}>
          <div style={{ width: 28, height: 28, borderRadius: 9, background: 'linear-gradient(145deg, #2B8EAA, #7B5FB8)', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 800, color: '#fff' }}>AR</div>
          <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 11.5, fontWeight: 700, color: '#EAF2FD' }}>Anita Rao</div><div style={{ marginTop: 2, fontSize: 10, color: T.SIDEBAR_MUTED }}>Karma Living · Owner</div></div>
          <div onClick={() => nav('a-overview')} title="Admin panel" style={{ padding: '6px 7px', borderRadius: 6, fontSize: 11, color: T.SIDEBAR_TEXT, cursor: 'pointer', background: 'rgba(255,255,255,.045)' }}>↗</div>
          <div onClick={() => nav('login')} title="Sign out" style={{ padding: '6px 7px', borderRadius: 6, fontSize: 12, color: T.SIDEBAR_TEXT, cursor: 'pointer', background: 'rgba(255,255,255,.045)' }}>↪</div>
        </div>
      </div>
      <style jsx>{`
        .nxc-nav-row { transition: background 100ms ease-out; }
        .nxc-nav-row:hover { background: rgba(255,255,255,.06); }
      `}</style>
    </motion.div>
  );
}
