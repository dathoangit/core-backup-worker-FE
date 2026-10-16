import Head from 'next/head';
import { AppShell } from 'src/components/layout/AppShell';
import { HomePageContent } from 'src/components/home/HomePageContent';

export default function IndexPage() {
  return (
    <>
      <Head>
        <title>Tổng quan backup</title>
        <meta
          name="description"
          content="Theo dõi trạng thái backup các database."
        />
      </Head>
      <AppShell>
        <HomePageContent />
      </AppShell>
    </>
  );
}
