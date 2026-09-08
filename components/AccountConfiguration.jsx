'use client';

import { motion } from 'motion/react';
import { useAppState } from '@/lib/AppStateContext';
import * as T from '@/lib/theme';
import ScenicBackdrop from './ScenicBackdrop';

const ITEMS = [
  ['General settings', 'Company profile, team details, and account defaults', 'profile', 'Configured', '⚙'],
  ['Shipment label', 'Label templates, layout, and print preferences', 'label', 'Configured', '◇'],
  ['Shipment invoice', 'Invoice templates, numbering, and tax details', 'inv-settings', 'Configured', '▤'],
  ['Order summary report', 'Report columns, date ranges, and export format', 'mis', 'Set up', '▥'],
  ['Printer settings', 'A4 and thermal printer profiles for labels', 'printer', 'Configured', '▣'],
  ['Scheduled email reports', 'Automated operational reports for your team', 'email', 'Set up', '✉'],
  ['COD remittance', 'Remittance cycles, bank details, and reconciliation', 'cod', 'Set up', '₹'],
  ['SMS notifications', 'Shipment alerts, delivery events, and templates', 'sms-api', 'Set up', '□'],
  ['WhatsApp notifications', 'Delivery updates and customer follow-ups', 'wa-api', 'Set up', '◌'],
  ['Order confirmation', 'Customer confirmation and event preferences', 'notifications', 'Configured', '✓'],
  ['Webhook', 'Event delivery endpoints and integration logs', 'webhook', 'Set up', '⌁'],
  ['Team and roles', 'Members, permissions, and workspace access', 'profile', 'Configured', '♙'],
];

export default function AccountConfiguration({ phone, mobile }) {
  const { nav } = useAppState();
  const cols = phone ? '1fr' : mobile ? 'repeat(2,minmax(0,1fr))' : 'repeat(auto-fit,minmax(230px,1fr))';
  const pad = phone ? 12 : mobile ? 16 : 22;

  return (
    <div style={{ flex: 1, position: 'relative', padding: `${phone ? 14 : 20}px ${pad}px 48px` }}>
      <ScenicBackdrop />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 22, fontWeight: 650, letterSpacing: '-.025em', color: T.TEXT }}>Account Configuration</div>
          <div style={{ marginTop: 5, fontSize: 14, color: T.TEXT_SECONDARY }}>Manage all your shipping workspace settings in one place.</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: cols, gap: phone ? 10 : 14 }}>
          {ITEMS.map(([title, description, destination, state, icon]) => {
            const configured = state === 'Configured';
            return (
              <motion.div
                key={title}
                onClick={() => nav(destination)}
                whileHover={{ transform: 'translateY(-3px)', boxShadow: '0 12px 26px rgba(15,31,61,.12)' }}
                whileTap={{ transform: 'scale(.985)' }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                style={{ minHeight: 178, cursor: 'pointer', position: 'relative', overflow: 'hidden', padding: '17px', borderRadius: 13, background: 'linear-gradient(165deg,var(--nx-glass-1),var(--nx-glass-2))', backdropFilter: 'blur(18px) saturate(180%)', border: '1px solid var(--nx-glass-border)', boxShadow: '0 2px 10px rgba(15,31,61,.05)' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center', background: 'rgba(0,179,164,.10)', border: '1px solid rgba(0,179,164,.16)', color: T.ACCENT, fontSize: 17, fontWeight: 700 }}>{icon}</div>
                  <div style={{ border: `1px solid ${configured ? '#9ADFCF' : '#ECD489'}`, background: configured ? '#EAF8F2' : '#FFF7DF', color: configured ? T.GREEN : T.AMBER, borderRadius: 16, padding: '3px 8px', fontSize: 11.5, fontWeight: 700 }}>{configured ? 'Configured' : 'Set up'}</div>
                </div>
                <div style={{ marginTop: 16, fontSize: 15, fontWeight: 700, color: T.TEXT }}>{title}</div>
                <div style={{ marginTop: 5, maxWidth: 260, fontSize: 12.5, lineHeight: 1.5, color: T.TEXT_SECONDARY }}>{description}</div>
                <div style={{ position: 'absolute', left: 17, right: 17, bottom: 13, paddingTop: 10, borderTop: `1px solid ${T.DIVIDER}`, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.TEXT_MUTED }}><span>{configured ? 'Ready to use' : 'No activity yet'}</span><span style={{ color: T.ACCENT, fontSize: 16 }}>›</span></div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
