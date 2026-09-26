import { staffAuth } from '@/lib/auth/staff-auth';
import { AdminHeaderView } from '@/components/layout/AdminHeaderView';

export async function AdminHeader() {
  const session = await staffAuth();
  return <AdminHeaderView session={session?.user?.id ? { user: { id: session.user.id } } : null} />;
}
