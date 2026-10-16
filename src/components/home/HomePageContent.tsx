import { BackupDashboard } from 'src/components/backup/BackupDashboard';

export function HomePageContent() {
  return (
    <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">
      <BackupDashboard />
    </section>
  );
}
