import Head from 'next/head';
import { RunsHistoryPanel } from 'src/components/backup/RunsHistoryPanel';
import { AdminPageGate } from 'src/components/layout/AdminPageGate';
import { AppShell } from 'src/components/layout/AppShell';

export default function RunsPage() {
  return (
    <AdminPageGate>
      <Head>
        <title>Lịch sử backup</title>
        <meta
          name="description"
          content="Lịch sử backup runs và kích hoạt thủ công."
        />
      </Head>
      <AppShell>
        <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">
          <RunsHistoryPanel />
        </section>
      </AppShell>
    </AdminPageGate>
  );
}
