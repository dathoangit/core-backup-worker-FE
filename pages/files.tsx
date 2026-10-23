import Head from 'next/head';
import { FileExplorerPanel } from 'src/components/backup/FileExplorerPanel';
import { AdminPageGate } from 'src/components/layout/AdminPageGate';
import { AppShell } from 'src/components/layout/AppShell';

export default function FilesPage() {
  return (
    <AdminPageGate>
      <Head>
        <title>Tra cứu file backup</title>
        <meta
          name="description"
          content="Duyệt file .csv.gz đã backup kèm dung lượng và checksum."
        />
      </Head>
      <AppShell>
        <section className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:py-10">
          <FileExplorerPanel />
        </section>
      </AppShell>
    </AdminPageGate>
  );
}
