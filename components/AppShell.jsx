'use client';

import { usePathname } from 'next/navigation';
import { idForPath } from '@/lib/routes';
import { useAppState } from '@/lib/AppStateContext';
import { MOBILE_BREAK, PAPER, TEXT } from '@/lib/theme';
import Sidebar from './Sidebar';
import MobileOverlay from './MobileOverlay';
import TopBar from './TopBar';
import CommandPalette from './CommandPalette';
import NdrDrawer from './NdrDrawer';

export default function AppShell({ children }) {
  const pathname = usePathname();
  const activeId = idForPath(pathname);
  const { vw } = useAppState();
  const mobile = vw <= MOBILE_BREAK;

  return (
    <div style={{ '--ac': '#00B3A4', minHeight: '100vh', background: PAPER, color: TEXT }}>
      <div style={{ display: 'flex' }}>
        <MobileOverlay mobile={mobile} />
        <Sidebar activeId={activeId} mobile={mobile} />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <TopBar activeId={activeId} mobile={mobile} />
          {children}
        </div>
        <NdrDrawer />
        <CommandPalette />
      </div>
    </div>
  );
}
