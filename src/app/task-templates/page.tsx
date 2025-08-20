'use client';

import React, { useState, useEffect } from 'react';
import { 
  AppLayout, 
  DataTable, 
  Modal 
} from '@/components';
import { TaskTemplateForm } from '@/components/task-templates/TaskTemplateForm';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { useApi, apiClient } from '@/hooks/useApi';
import type { Column } from '@/components/ui/DataTable';
import styles from './page.module.css';

interface Instruction {
  id: number;
  name: string;
}

interface RequestType {
  id: number;
  name: string;
}

interface TaskTemplate {
  id: number;
  name: string;
  instruction: {
    id: number;
    name: string;
  };
  requestType: {
    id: number;
    name: string;
  };
  location?: string;
  firstDueDate: string;
  repeatEnum: string;
  // Frequency fields (as needed)
  dailyEveryXDays?: number;
  weeklySun?: boolean;
  weeklyMon?: boolean;
  weeklyTues?: boolean;
  weeklyWed?: boolean;
  weeklyThur?: boolean;
  weeklyFri?: boolean;
  weeklySat?: boolean;
  weeklyEveryXWeeks?: number;
  monthlyMode?: string;
  monthlyEveryXMonths?: number;
  yearlyEveryXYears?: number;
  // Optional fields
  excludeFrom?: string;
  excludeThru?: string;
  nextDueMode?: string;
  inventoryNames?: string;
  inventoryQuantities?: string;
  estTimeHours?: number;
  notes?: string;
  _count: {
    pmTemplateTasks: number;
  };
}

export default function TaskTemplatesPage() {
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([]);
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [requestTypes, setRequestTypes] = useState<RequestType[]>([]);
  const [selectedTaskTemplate, setSelectedTaskTemplate] = useState<TaskTemplate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTaskTemplates = useApi(() => apiClient.get<TaskTemplate[]>('/api/task-templates'));
  const fetchInstructions = useApi(() => apiClient.get<Instruction[]>('/api/instructions'));
  const fetchRequestTypes = useApi(() => apiClient.get<RequestType[]>('/api/request-types'));
  const createTaskTemplate = useApi((data: any) => apiClient.post('/api/task-templates', data));
  const updateTaskTemplate = useApi((id: number, data: any) => apiClient.put(`/api/task-templates/${id}`, data));
  const deleteTaskTemplate = useApi((id: number) => apiClient.delete(`/api/task-templates/${id}`));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [taskTemplatesData, instructionsData, requestTypesData] = await Promise.all([
        fetchTaskTemplates.execute(),
        fetchInstructions.execute(),
        fetchRequestTypes.execute()
      ]);
      setTaskTemplates(taskTemplatesData);
      setInstructions(instructionsData);
      setRequestTypes(requestTypesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleCreate = () => {
    setSelectedTaskTemplate(null);
    setIsModalOpen(true);
  };

  const handleEdit = (taskTemplate: TaskTemplate) => {
    setSelectedTaskTemplate(taskTemplate);
    setIsModalOpen(true);
  };

  const handleDelete = async (taskTemplate: TaskTemplate) => {
    if (taskTemplate._count.pmTemplateTasks > 0) {
      alert('Cannot delete task template that is used by PM templates. Please remove all PM template references first.');
      return;
    }

    if (confirm(`Are you sure you want to delete "${taskTemplate.name}"?`)) {
      try {
        await deleteTaskTemplate.execute(taskTemplate.id);
        await loadData();
      } catch (error: any) {
        alert(error.message || 'Failed to delete task template');
      }
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      if (selectedTaskTemplate) {
        await updateTaskTemplate.execute(selectedTaskTemplate.id, data);
      } else {
        await createTaskTemplate.execute(data);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to save task template');
      throw error;
    }
  };

  const formatFrequency = (taskTemplate: TaskTemplate): string => {
    const { repeatEnum } = taskTemplate;
    
    switch (repeatEnum) {
      case 'NEVER':
        return 'One-time only';
      
      case 'DAILY':
        const days = taskTemplate.dailyEveryXDays || 1;
        return days === 1 ? 'Daily' : `Every ${days} days`;
      
      case 'WEEKLY':
        const weeks = taskTemplate.weeklyEveryXWeeks || 1;
        const selectedDays = [
          taskTemplate.weeklySun && 'Sun',
          taskTemplate.weeklyMon && 'Mon', 
          taskTemplate.weeklyTues && 'Tue',
          taskTemplate.weeklyWed && 'Wed',
          taskTemplate.weeklyThur && 'Thu',
          taskTemplate.weeklyFri && 'Fri',
          taskTemplate.weeklySat && 'Sat'
        ].filter(Boolean);
        const weeksText = weeks === 1 ? '' : ` (every ${weeks} weeks)`;
        return `${selectedDays.join(', ')}${weeksText}`;
      
      case 'MONTHLY':
        const months = taskTemplate.monthlyEveryXMonths || 1;
        const monthsText = months === 1 ? 'Monthly' : `Every ${months} months`;
        const modeText = taskTemplate.monthlyMode === 'DAY_OF_MONTH' ? 'same date' : 
                        taskTemplate.monthlyMode === 'DAY_OF_WEEK' ? 'same day of week' :
                        taskTemplate.monthlyMode?.toLowerCase().replace(/_/g, ' ');
        return `${monthsText} (${modeText})`;
      
      case 'YEARLY':
        const years = taskTemplate.yearlyEveryXYears || 1;
        return years === 1 ? 'Yearly' : `Every ${years} years`;
      
      default:
        return repeatEnum;
    }
  };

  const columns: Column<TaskTemplate>[] = [
    {
      key: 'name',
      header: 'Task Name',
      sortable: true,
    },
    {
      key: 'instruction.name',
      header: 'Instruction',
      sortable: true,
    },
    {
      key: 'requestType.name',
      header: 'Request Type',
      sortable: true,
    },
    {
      key: 'location',
      header: 'Location',
      render: (taskTemplate) => taskTemplate.location || '-',
    },
    {
      key: 'firstDueDate',
      header: 'First Due',
      render: (taskTemplate) => new Date(taskTemplate.firstDueDate).toLocaleDateString(),
    },
    {
      key: 'repeatEnum',
      header: 'Frequency',
      render: (taskTemplate) => formatFrequency(taskTemplate),
    },
    {
      key: '_count.pmTemplateTasks',
      header: 'Used by PMs',
      render: (taskTemplate) => taskTemplate._count.pmTemplateTasks.toString(),
    },
  ];

  return (
    <AuthProvider>
      <AppLayout title="Task Templates">
        <div className={styles.container}>
          <DataTable
            data={taskTemplates}
            columns={columns}
            onAdd={handleCreate}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isLoading={fetchTaskTemplates.isLoading}
            title="Task Templates"
            emptyMessage="No task templates found. Create your first task template to get started."
          />

          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={selectedTaskTemplate ? 'Edit Task Template' : 'Create New Task Template'}
            size="xl"
          >
            <TaskTemplateForm
              taskTemplate={selectedTaskTemplate || undefined}
              instructions={instructions}
              requestTypes={requestTypes}
              onSubmit={handleSubmit}
              onCancel={() => setIsModalOpen(false)}
              isLoading={createTaskTemplate.isLoading || updateTaskTemplate.isLoading}
            />
          </Modal>
        </div>
      </AppLayout>
    </AuthProvider>
  );
}
