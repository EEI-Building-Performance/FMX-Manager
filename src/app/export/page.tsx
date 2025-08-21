'use client';

import { AppLayout, AuthProvider } from '@/components';
import { ExportManager } from '@/components/export/ExportManager';
import styles from './page.module.css';

export default function ExportPage() {
  return (
    <AuthProvider>
      <AppLayout title="Export to FMX">
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>Export to FMX</h1>
            <p className={styles.subtitle}>
              Generate FMX-compatible Excel files with Instructions, Tasks, and Occurrences sheets
            </p>
          </div>

          <div className={styles.content}>
            <ExportManager />
          </div>
        </div>
      </AppLayout>
    </AuthProvider>
  );
}
