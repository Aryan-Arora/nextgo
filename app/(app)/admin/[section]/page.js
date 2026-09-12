import AppPage from '@/components/AppPage';
import { ADMIN_SECTION_IDS } from '@/lib/routes';

export default async function Page({ params }) {
  const { section } = await params;
  return <AppPage id={ADMIN_SECTION_IDS[section] || 'a-overview'} />;
}
