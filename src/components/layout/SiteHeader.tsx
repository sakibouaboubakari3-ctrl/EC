import { clientAuth } from '@/lib/auth/client-auth';
import { SiteHeaderView } from '@/components/layout/SiteHeaderView';

export async function SiteHeader() {
  const session = await clientAuth();
  return <SiteHeaderView session={session?.user?.id ? { user: { id: session.user.id } } : null} />;
}
