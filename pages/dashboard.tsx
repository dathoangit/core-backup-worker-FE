import Head from 'next/head';
import { AppShell } from 'src/components/layout/AppShell';
import { WallboardDashboard } from 'src/components/wallboard/WallboardDashboard';

export default function DashboardPage() {
  return (
    <>
      <Head>
        <title>Backup Wallboard</title>
        <meta
          name="description"
          content="Màn hình trung tâm theo dõi backup realtime."
        />
      </Head>
      <AppShell showChrome={false}>
        <WallboardDashboard />
      </AppShell>
    </>
  );
}
