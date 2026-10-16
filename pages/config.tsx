import Head from 'next/head';
import { SettingsManagementPanel } from 'src/components/admin/settings/SettingsManagementPanel';
import { AdminPageGate } from 'src/components/layout/AdminPageGate';
import { AppShell } from 'src/components/layout/AppShell';

export default function ConfigPage() {
  return (
    <AdminPageGate>
      <Head>
        <title>Cấu hình hệ thống</title>
        <meta
          name="description"
          content="Quản lý settings backup và nguồn dữ liệu."
        />
      </Head>
      <AppShell>
        <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">
          <SettingsManagementPanel />
        </section>
      </AppShell>
    </AdminPageGate>
  );
}
