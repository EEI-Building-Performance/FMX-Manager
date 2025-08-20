import { AppLayout } from '@/components';
import styles from "./page.module.css";

export default function Home() {
  return (
    <AppLayout title="Dashboard">
      <div className={styles.container}>
        <div className={styles.welcome}>
          <h2 className={styles.heading}>Welcome to FMX Maintenance Template Manager</h2>
          <p className={styles.description}>
            Create and manage planned maintenance templates for your school district's HVAC equipment. 
            Generate FMX-compatible import files with ease.
          </p>
        </div>

        <div className={styles.quickActions}>
          <h3 className={styles.sectionTitle}>Quick Actions</h3>
          <div className={styles.actionGrid}>
            <div className={styles.actionCard}>
              <h4>Buildings & Equipment</h4>
              <p>Import and manage your buildings and HVAC equipment inventory.</p>
            </div>
            <div className={styles.actionCard}>
              <h4>Create Instructions</h4>
              <p>Define step-by-step maintenance instruction sets.</p>
            </div>
            <div className={styles.actionCard}>
              <h4>Task Templates</h4>
              <p>Set up maintenance task templates with schedules and requirements.</p>
            </div>
            <div className={styles.actionCard}>
              <h4>Export to FMX</h4>
              <p>Generate Excel files ready for FMX import.</p>
            </div>
          </div>
        </div>

        <div className={styles.getStarted}>
          <h3 className={styles.sectionTitle}>Getting Started</h3>
          <ol className={styles.stepsList}>
            <li>Import your buildings and equipment data</li>
            <li>Create instruction sets for your maintenance procedures</li>
            <li>Define task templates with scheduling information</li>
            <li>Bundle tasks into PM templates</li>
            <li>Assign templates to specific equipment</li>
            <li>Export FMX-compatible spreadsheets</li>
          </ol>
        </div>
      </div>
    </AppLayout>
  );
}
