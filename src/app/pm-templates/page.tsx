'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout, DataTable, Button, Modal } from '@/components';
import { PMTemplateForm } from '@/components/pm-templates/PMTemplateForm';
import { useApi, apiClient } from '@/hooks/useApi';
import { cx } from '@/utils/cx';
import styles from './page.module.css';

interface TaskTemplate {
  id: number;
  name: string;
  instruction: {
    name: string;
  };
  requestType: {
    name: string;
  };
  repeatEnum: string;
}

interface PMTemplate {
  id: number;
  name: string;
  description: string | null;
  tasks: Array<{
    taskTemplate: TaskTemplate;
  }>;
  _count: {
    assignments: number;
  };
}

export default function PMTemplatesPage() {
  const [pmTemplates, setPMTemplates] = useState<PMTemplate[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PMTemplate | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const fetchPMTemplates = useApi(() => apiClient.get<PMTemplate[]>('/api/pm-templates'));
  const createPMTemplate = useApi((data: any) => apiClient.post('/api/pm-templates', data));
  const updatePMTemplate = useApi((id: number, data: any) => apiClient.put(`/api/pm-templates/${id}`, data));
  const deletePMTemplate = useApi((id: number) => apiClient.delete(`/api/pm-templates/${id}`));

  useEffect(() => {
    loadPMTemplates();
  }, []);

  const loadPMTemplates = async () => {
    try {
      const pmTemplates = await fetchPMTemplates.execute();
      setPMTemplates(pmTemplates || []);
    } catch (error) {
      console.error('Error loading PM templates:', error);
    }
  };

  const handleAdd = () => {
    setEditingTemplate(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (pmTemplate: PMTemplate) => {
    setEditingTemplate(pmTemplate);
    setIsModalOpen(true);
  };

  const handleDelete = async (pmTemplate: PMTemplate) => {
    if (!confirm(`Are you sure you want to delete "${pmTemplate.name}"?`)) {
      return;
    }

    try {
      await deletePMTemplate.execute(pmTemplate.id);
      await loadPMTemplates();
    } catch (error) {
      console.error('Error deleting PM template:', error);
      alert('Failed to delete PM template');
    }
  };

  const handleFormSubmit = async (formData: any) => {
    setIsLoading(true);
    
    try {
      if (editingTemplate) {
        await updatePMTemplate.execute(editingTemplate.id, formData);
      } else {
        await createPMTemplate.execute(formData);
      }
      
      setIsModalOpen(false);
      setEditingTemplate(undefined);
      await loadPMTemplates();
    } catch (error) {
      console.error('Error saving PM template:', error);
      alert('Failed to save PM template');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTaskCount = (count: number) => {
    return count === 1 ? '1 task' : `${count} tasks`;
  };

  const formatAssignmentCount = (count: number) => {
    return count === 1 ? '1 assignment' : `${count} assignments`;
  };

  const getTasksSummary = (tasks: Array<{taskTemplate: TaskTemplate}>) => {
    if (tasks.length === 0) return 'No tasks';
    if (tasks.length <= 3) {
      return tasks.map(t => t.taskTemplate.name).join(', ');
    }
    return `${tasks.slice(0, 2).map(t => t.taskTemplate.name).join(', ')} and ${tasks.length - 2} more`;
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (pmTemplate: PMTemplate) => (
        <div>
          <div className={styles.templateName}>{pmTemplate.name}</div>
          {pmTemplate.description && (
            <div className={styles.templateDescription}>{pmTemplate.description}</div>
          )}
        </div>
      )
    },
    {
      key: 'tasks',
      header: 'Tasks',
      render: (pmTemplate: PMTemplate) => (
        <div>
          <div className={styles.taskCount}>
            {formatTaskCount(pmTemplate.tasks.length)}
          </div>
          <div className={styles.tasksSummary}>
            {getTasksSummary(pmTemplate.tasks)}
          </div>
        </div>
      )
    },
    {
      key: 'assignments',
      header: 'Assignments',
      render: (pmTemplate: PMTemplate) => (
        <div className={styles.assignmentCount}>
          {formatAssignmentCount(pmTemplate._count.assignments)}
        </div>
      )
    }
  ];

  return (
    <AppLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>PM Templates</h1>
            <p className={styles.subtitle}>
              Create and manage preventive maintenance template groups
            </p>
          </div>
          <Button onClick={handleAdd}>
            Add PM Template
          </Button>
        </div>

        <div className={styles.content}>
          <DataTable
            data={pmTemplates}
            columns={columns}
            loading={fetchPMTemplates.isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            emptyMessage="No PM templates found. Create your first PM template to get started."
          />
        </div>

        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingTemplate(undefined);
          }}
          title={editingTemplate ? 'Edit PM Template' : 'Add PM Template'}
          size="large"
        >
          <PMTemplateForm
            pmTemplate={editingTemplate}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setIsModalOpen(false);
              setEditingTemplate(undefined);
            }}
            isLoading={isLoading}
          />
        </Modal>
      </div>
    </AppLayout>
  );
}