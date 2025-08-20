'use client';

import React from 'react';
import { AppLayout } from '@/components';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { AssignmentManager } from '@/components/assignments/AssignmentManager';
import styles from './page.module.css';

export default function AssignmentsPage() {
  return (
    <AuthProvider>
      <AppLayout title="PM Template Assignments">
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>PM Template Assignments</h1>
            <p className={styles.subtitle}>
              Assign preventive maintenance templates to specific equipment in buildings
            </p>
          </div>

          <div className={styles.content}>
            <AssignmentManager />
          </div>
        </div>
      </AppLayout>
    </AuthProvider>
  );
}