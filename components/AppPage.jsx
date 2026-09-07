'use client';

import { TABLES, FORMS, CONNECTORS } from '@/lib/data';
import { useAppState } from '@/lib/AppStateContext';
import { MOBILE_BREAK, NARROW_BREAK, PHONE_BREAK } from '@/lib/theme';
import PageHeader from './PageHeader';
import DashboardContent from './DashboardContent';
import TablePage from './TablePage';
import FormPage from './FormPage';

export default function AppPage({ id, isDashboard = false }) {
  const { vw } = useAppState();
  const mobile = vw <= MOBILE_BREAK;
  const phone = vw <= PHONE_BREAK;
  const narrow = vw <= NARROW_BREAK;

  const hasTable = !!TABLES[id];
  const hasForm = !isDashboard && !hasTable && !!(FORMS[id] || CONNECTORS[id]);

  return (
    <>
      <PageHeader activeId={id} isDashboard={isDashboard} mobile={mobile} phone={phone} />
      {isDashboard && <DashboardContent mobile={mobile} narrow={narrow} phone={phone} />}
      {hasTable && <TablePage activeId={id} mobile={mobile} phone={phone} />}
      {hasForm && <FormPage activeId={id} mobile={mobile} phone={phone} />}
    </>
  );
}
