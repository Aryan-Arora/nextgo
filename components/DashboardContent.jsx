'use client';

import { useState } from 'react';
import { METRICS, PIPELINE, QUEUE, TREND_A, TREND_B, COURIER_PERF } from '@/lib/data';
import { spark } from '@/lib/charts';
import { useAppState } from '@/lib/AppStateContext';
import * as T from '@/lib/theme';
import ScenicBackdrop from './ScenicBackdrop';
import DashboardStatCard from './DashboardStatCard';
import DashboardStatCardModal from './DashboardStatCardModal';
import TrendChart from './TrendChart';

export default function DashboardContent({ mobile, narrow }) {
  const { kpis, stage, setStage, expanded, toggleExpanded, queueTab, setQueueTab, setDrawerOpen } = useAppState();
  const [expandedCardId, setExpandedCardId] = useState(null);

  const statCards = METRICS.filter((m) => kpis.indexOf(m[0]) >= 0 && m[2] === 'Card').map((m, i) => ({
    id: m[0], label: m[1], value: m[4], delta: m[5], sub: m[7], seed: i * 2 + 1,
    deltaColor: m[6] === 'up' ? T.GREEN : m[6] === 'down' ? T.RED : T.MUTE,
    sparkPath: spark(i * 2 + 1),
    sparkColor: m[6] === 'up' ? T.ACCENT : m[6] === 'down' ? '#D9A79E' : '#BDB8AC',
  }));
  const expandedCard = statCards.find((c) => c.id === expandedCardId) || null;

  const showTrend = kpis.indexOf('order_volume') >= 0;
  const showCourier = kpis.indexOf('courier_perf') >= 0;
  const showCod = kpis.indexOf('cod_split') >= 0;
  const chartColCount = [showTrend, showCourier, showCod].filter(Boolean).length;
  const chartCols = mobile ? '1fr' : chartColCount ? [showTrend ? '1.7fr' : null, showCourier ? '1fr' : null, showCod ? '1fr' : null].filter(Boolean).join(' ') : '1fr';

  const total = PIPELINE.reduce((a, p) => a + p[1], 0);
  const statCols = mobile ? 'repeat(2,1fr)' : narrow ? 'repeat(3,1fr)' : 'repeat(6,1fr)';
  const pipeCols = mobile ? 'repeat(3,1fr)' : narrow ? 'repeat(5,1fr)' : 'repeat(9,1fr)';

  const queueTabs = ['All', 'Time critical', 'Money at risk'];

  const GLASS = {
    position: 'relative',
    background: 'linear-gradient(165deg, var(--nx-glass-1) 0%, var(--nx-glass-2) 100%)',
    backdropFilter: 'blur(18px) saturate(180%)',
    border: '1px solid var(--nx-glass-border)',
    borderRadius: 14,
    boxShadow: '0 1px 1px rgba(15,23,20,.05), 0 10px 28px rgba(15,23,20,.10)',
  };
  const GlassSheen = () => <div style={{ position: 'absolute', top: 0, left: 14, right: 14, height: 1, background: 'var(--nx-glass-border)' }} />;

  return (
    <div style={{ flex: 1, padding: '0 0 48px', position: 'relative' }}>
      <ScenicBackdrop />

      <div style={{ position: 'relative', zIndex: 1, padding: '22px 22px 6px', display: 'grid', gridTemplateColumns: statCols, gap: 14 }}>
        {statCards.map((c) => (
          <DashboardStatCard key={c.id} card={c} hidden={expandedCardId === c.id} onOpen={setExpandedCardId} />
        ))}
      </div>

      <DashboardStatCardModal card={expandedCard} onClose={() => setExpandedCardId(null)} />

      <div style={{ position: 'relative', zIndex: 1, padding: '6px 22px 0' }}>
        <div style={{ ...GLASS, overflow: 'hidden' }}>
          <GlassSheen />
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '13px 18px', borderBottom: `1px solid ${T.DIVIDER}` }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: T.SECTION_HEAD }}>Order pipeline</div>
              <div style={{ fontFamily: T.MONO, fontSize: 12, color: T.TEXT_MUTED }}>12,480 orders · click a stage to filter the queue</div>
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: '#0E5049', cursor: 'pointer' }}>Open in MIS →</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: pipeCols }}>
            {PIPELINE.map(([label, count, color]) => (
              <div
                key={label}
                onClick={() => setStage(label)}
                style={{ borderRight: `1px solid ${T.DIVIDER}`, padding: '0 0 14px', cursor: 'pointer', background: stage === label ? 'rgba(0,179,164,.12)' : 'transparent' }}
              >
                <div style={{ height: 3, background: color }} />
                <div style={{ padding: '12px 14px 0' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: T.TEXT_SECONDARY, lineHeight: 1.3, minHeight: 26 }}>{label}</div>
                  <div style={{ fontVariantNumeric: 'tabular-nums', fontSize: 21, fontWeight: 600, letterSpacing: '-.015em', marginTop: 6 }}>{count.toLocaleString('en-IN')}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                    <div style={{ flex: 1, height: 2, background: T.DIVIDER }}><div style={{ height: 2, background: color, width: `${(count / total) * 100}%` }} /></div>
                    <div style={{ fontFamily: T.MONO, fontSize: 10, color: T.TEXT_MUTED }}>{((count / total) * 100).toFixed(1)}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...GLASS, marginTop: 20, overflow: 'hidden' }}>
          <GlassSheen />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 18px', borderBottom: `1px solid ${T.DIVIDER}`, gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: T.SECTION_HEAD }}>Decisions waiting on you</div>
              <div style={{ fontFamily: T.MONO, fontSize: 12, color: T.TEXT_MUTED }}>expand a row to act without leaving this screen</div>
            </div>
            <div style={{ display: 'flex', gap: 7 }}>
              {queueTabs.map((label) => {
                const on = queueTab === label;
                return (
                  <div
                    key={label}
                    onClick={() => setQueueTab(label)}
                    style={{ height: 28, display: 'flex', alignItems: 'center', padding: '0 11px', border: `1px solid ${on ? T.NAVY : T.INPUT_BORDER}`, background: on ? T.NAVY : T.SURFACE, color: on ? '#fff' : T.TEXT_LABEL, fontSize: 11.5, fontWeight: on ? 600 : 500, cursor: 'pointer' }}
                  >
                    {label}
                  </div>
                );
              })}
            </div>
          </div>
          {QUEUE.map(([n, title, sub, id, sla, key, cta, primary, secondaryLabel, rows, rec]) => {
            const open = expanded === id;
            const color = id === 'ndr' ? T.AMBER : id === 'weight' ? T.RED : id === 'pickup' ? '#2A4570' : T.GREEN;
            const chipBd = id === 'ndr' ? '#E5D3A8' : id === 'weight' ? '#E8C4BD' : id === 'pickup' ? '#C6D2E6' : '#BDDCC9';
            return (
              <div key={id}>
                <div
                  onClick={() => toggleExpanded(id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 15, padding: '0 18px', height: 56, borderBottom: `1px solid ${T.ROW_DIVIDER}`, cursor: 'pointer', background: open ? 'rgba(0,179,164,.08)' : 'transparent' }}
                >
                  <div style={{ fontSize: 10.5, color: T.TEXT_FAINT, width: 8, transform: open ? 'rotate(90deg)' : 'none' }}>▸</div>
                  <div style={{ width: 3, height: 28, background: color }} />
                  <div style={{ fontVariantNumeric: 'tabular-nums', fontSize: 18, fontWeight: 600, width: 58 }}>{n}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
                    <div style={{ fontSize: 12, color: T.TEXT_MUTED, marginTop: 2 }}>{sub}</div>
                  </div>
                  <div style={{ fontFamily: T.MONO, fontSize: 11, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color, border: `1px solid ${chipBd}`, padding: '2px 6px' }}>{sla}</div>
                  <div style={{ fontFamily: T.MONO, fontSize: 10, color: T.TEXT_SECONDARY, border: `1px solid ${T.INPUT_BORDER}`, padding: '2px 5px' }}>{key}</div>
                  <div
                    onClick={(e) => { e.stopPropagation(); setDrawerOpen(true); }}
                    style={{ fontSize: 11.5, fontWeight: 600, color: '#0E5049' }}
                  >
                    {cta} →
                  </div>
                </div>
                {open && (
                  <div style={{ background: T.SURFACE_SOFT, borderBottom: `1px solid ${T.DIVIDER}`, padding: '18px 18px 20px 62px', animation: 'nxc-expand .14s ease-out' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '340px 1fr', gap: 22 }}>
                      <div>
                        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: T.TEXT_FAINT }}>Breakdown</div>
                        <div style={{ marginTop: 10, background: T.SURFACE, border: `1px solid ${T.BORDER}` }}>
                          {rows.map(([k, v], i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderBottom: `1px solid ${T.ROW_DIVIDER}`, fontSize: 12 }}>
                              <div style={{ color: T.TEXT_LABEL }}>{k}</div>
                              <div style={{ fontFamily: T.MONO }}>{v}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: T.TEXT_FAINT }}>Recommended action</div>
                        <div style={{ fontSize: 12.5, color: T.TEXT_LABEL, marginTop: 10, lineHeight: 1.65, maxWidth: 520 }}>{rec}</div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                          <div onClick={() => setDrawerOpen(true)} style={{ height: 32, padding: '0 13px', background: T.NAVY, color: '#fff', display: 'flex', alignItems: 'center', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>{primary}</div>
                          <div style={{ height: 32, padding: '0 13px', border: `1px solid ${T.INPUT_BORDER}`, background: T.SURFACE, display: 'flex', alignItems: 'center', fontSize: 12.5, cursor: 'pointer' }}>{secondaryLabel}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: chartCols, gap: 20, marginTop: 20 }}>
          {showTrend && (
            <div style={{ ...GLASS, overflow: 'hidden' }}>
              <GlassSheen />
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '13px 18px', borderBottom: `1px solid ${T.DIVIDER}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: T.SECTION_HEAD }}>Volume vs. delivered</div>
                <div style={{ display: 'flex', gap: 14, fontFamily: T.MONO, fontSize: 10, color: T.TEXT_SECONDARY }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 9, height: 2, background: T.NAVY }} />ORDERS</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 9, height: 2, background: T.ACCENT }} />DELIVERED</div>
                </div>
              </div>
              <div style={{ padding: '16px 18px 12px', display: 'flex', gap: 12 }}>
                <div style={{ flex: '0 0 30px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontFamily: T.MONO, fontSize: 10.5, color: T.TEXT_FAINT, textAlign: 'right', height: 196 }}>
                  <div>150</div><div>100</div><div>50</div><div>0</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <TrendChart seriesA={TREND_A} seriesB={TREND_B} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: T.MONO, fontSize: 10.5, color: T.TEXT_FAINT, marginTop: 7 }}>
                    <div>05 AUG</div><div>12 AUG</div><div>19 AUG</div><div>26 AUG</div><div>03 SEP</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {showCourier && (
            <div style={{ ...GLASS, overflow: 'hidden' }}>
              <GlassSheen />
              <div style={{ padding: '13px 18px', borderBottom: `1px solid ${T.DIVIDER}`, fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: T.SECTION_HEAD }}>Courier performance</div>
              {COURIER_PERF.map((c) => (
                <div key={c.name} style={{ padding: '11px 18px', borderBottom: `1px solid ${T.PAPER}` }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontVariantNumeric: 'tabular-nums', fontSize: 13, fontWeight: 600, color: c.color === 'accent' ? T.ACCENT : c.color }}>{c.rate}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 7 }}>
                    <div style={{ flex: 1, height: 4, background: T.DIVIDER }}><div style={{ height: 4, background: c.color === 'accent' ? T.ACCENT : c.color, width: c.w }} /></div>
                    <div style={{ fontFamily: T.MONO, fontSize: 10, color: T.TEXT_FAINT, width: 48, textAlign: 'right' }}>{c.vol}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {showCod && (
            <div style={{ ...GLASS, overflow: 'hidden' }}>
              <GlassSheen />
              <div style={{ padding: '13px 18px', borderBottom: `1px solid ${T.DIVIDER}`, fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: T.SECTION_HEAD }}>COD vs. prepaid</div>
              <div style={{ padding: 18 }}>
                <div style={{ display: 'flex', height: 34, border: `1px solid ${T.BORDER}` }}>
                  <div style={{ width: '62%', background: T.NAVY, color: '#fff', display: 'flex', alignItems: 'center', padding: '0 10px', fontVariantNumeric: 'tabular-nums', fontSize: 12.5, fontWeight: 600 }}>62% COD</div>
                  <div style={{ width: '38%', background: T.ACCENT, color: '#06212C', display: 'flex', alignItems: 'center', padding: '0 10px', fontVariantNumeric: 'tabular-nums', fontSize: 12.5, fontWeight: 600 }}>38%</div>
                </div>
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.PAPER}`, fontSize: 12 }}><div style={{ color: T.TEXT_SECONDARY }}>COD orders</div><div style={{ fontFamily: T.MONO }}>7,738</div></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.PAPER}`, fontSize: 12 }}><div style={{ color: T.TEXT_SECONDARY }}>COD collected</div><div style={{ fontFamily: T.MONO }}>₹41.2L</div></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 12 }}><div style={{ color: T.TEXT_SECONDARY }}>Prepaid value</div><div style={{ fontFamily: T.MONO }}>₹26.8L</div></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
