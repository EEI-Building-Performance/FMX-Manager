import { AppLayout, AuthProvider } from '@/components';
import Link from 'next/link';
import {
  BuildingIcon,
  ClipboardIcon,
  TemplateIcon,
  BundleIcon,
  AssignmentIcon,
  ExportIcon
} from '@/components/icons/Icon';
import styles from "./page.module.css";

export default function Home() {
  return (
    <AuthProvider>
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
            <Link href="/buildings" className={styles.actionCard}>
              <div className={styles.actionIcon}>
                <BuildingIcon size={24} />
              </div>
              <div className={styles.actionContent}>
                <h4>Buildings & Equipment</h4>
                <p>Import and manage your buildings and HVAC equipment inventory.</p>
              </div>
            </Link>
            <Link href="/instructions" className={styles.actionCard}>
              <div className={styles.actionIcon}>
                <ClipboardIcon size={24} />
              </div>
              <div className={styles.actionContent}>
                <h4>Create Instructions</h4>
                <p>Define step-by-step maintenance instruction sets.</p>
              </div>
            </Link>
            <Link href="/task-templates" className={styles.actionCard}>
              <div className={styles.actionIcon}>
                <TemplateIcon size={24} />
              </div>
              <div className={styles.actionContent}>
                <h4>Task Templates</h4>
                <p>Set up maintenance task templates with schedules and requirements.</p>
              </div>
            </Link>
            <Link href="/pm-templates" className={styles.actionCard}>
              <div className={styles.actionIcon}>
                <BundleIcon size={24} />
              </div>
              <div className={styles.actionContent}>
                <h4>PM Templates</h4>
                <p>Bundle task templates into comprehensive maintenance plans.</p>
              </div>
            </Link>
            <Link href="/assignments" className={styles.actionCard}>
              <div className={styles.actionIcon}>
                <AssignmentIcon size={24} />
              </div>
              <div className={styles.actionContent}>
                <h4>Assignments</h4>
                <p>Assign PM templates to specific equipment and buildings.</p>
              </div>
            </Link>
            <Link href="/export" className={styles.actionCard}>
              <div className={styles.actionIcon}>
                <ExportIcon size={24} />
              </div>
              <div className={styles.actionContent}>
                <h4>Export to FMX</h4>
                <p>Generate Excel files ready for FMX import.</p>
              </div>
            </Link>
          </div>
        </div>

        <div className={styles.getStarted}>
          <h3 className={styles.sectionTitle}>Getting Started</h3>
          <ol className={styles.stepsList}>
            <li>
              <Link href="/buildings">Import your buildings and equipment data</Link>
            </li>
            <li>
              <Link href="/instructions">Create instruction sets for your maintenance procedures</Link>
            </li>
            <li>
              <Link href="/task-templates">Define task templates with scheduling information</Link>
            </li>
            <li>
              <Link href="/pm-templates">Bundle tasks into PM templates</Link>
            </li>
            <li>
              <Link href="/assignments">Assign templates to specific equipment</Link>
            </li>
            <li>
              <Link href="/export">Export FMX-compatible spreadsheets</Link>
            </li>
          </ol>
        </div>
      </div>
    </AppLayout>
  </AuthProvider>
  );
}
