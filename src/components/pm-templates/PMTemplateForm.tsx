'use client';

import React, { useState, useEffect } from 'react';
import { Button, Input } from '@/components';
import { useApi, apiClient } from '@/hooks/useApi';
import { cx } from '@/utils/cx';
import styles from './PMTemplateForm.module.css';

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
  id?: number;
  name: string;
  description?: string | null;
  tasks?: Array<{
    taskTemplate: TaskTemplate;
  }>;
}

interface PMTemplateFormProps {
  pmTemplate?: PMTemplate;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const PMTemplateForm: React.FC<PMTemplateFormProps> = ({
  pmTemplate,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    name: pmTemplate?.name || '',
    description: pmTemplate?.description || ''
  });
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>(
    pmTemplate?.tasks?.map(t => t.taskTemplate.id) || []
  );
  const [availableTasks, setAvailableTasks] = useState<TaskTemplate[]>([]);
  const [taskSearchTerm, setTaskSearchTerm] = useState('');

  const fetchTasks = useApi(() => apiClient.get<TaskTemplate[]>('/api/task-templates'));

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const tasks = await fetchTasks.execute();
        setAvailableTasks(tasks || []);
      } catch (error) {
        console.error('Error loading tasks:', error);
      }
    };

    loadTasks();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      taskTemplateIds: selectedTaskIds
    });
  };

  const addTask = (taskId: number) => {
    if (!selectedTaskIds.includes(taskId)) {
      setSelectedTaskIds(prev => [...prev, taskId]);
    }
  };

  const removeTask = (taskId: number) => {
    setSelectedTaskIds(prev => prev.filter(id => id !== taskId));
  };

  const getFilteredAvailableTasks = () => {
    return availableTasks.filter(task => {
      const matchesSearch = !taskSearchTerm || 
        task.name.toLowerCase().includes(taskSearchTerm.toLowerCase()) ||
        task.instruction.name.toLowerCase().includes(taskSearchTerm.toLowerCase()) ||
        task.requestType.name.toLowerCase().includes(taskSearchTerm.toLowerCase());
      
      return matchesSearch && !selectedTaskIds.includes(task.id);
    });
  };

  const getSelectedTasks = () => {
    return availableTasks.filter(task => selectedTaskIds.includes(task.id));
  };

  const formatFrequency = (repeatEnum: string) => {
    switch (repeatEnum) {
      case 'NEVER': return 'One-time';
      case 'DAILY': return 'Daily';
      case 'WEEKLY': return 'Weekly';
      case 'MONTHLY': return 'Monthly';
      case 'YEARLY': return 'Yearly';
      default: return repeatEnum;
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.basicInfo}>
        <h3 className={styles.sectionTitle}>Basic Information</h3>
        
        <div className={styles.field}>
          <label htmlFor="name" className={styles.label}>
            Name *
          </label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter PM template name"
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="description" className={styles.label}>
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Enter description (optional)"
            className={styles.textarea}
            rows={3}
          />
        </div>
      </div>

      <div className={styles.taskSelection}>
        <h3 className={styles.sectionTitle}>Task Templates</h3>
        
        <div className={styles.taskPanels}>
          {/* Available Tasks Panel */}
          <div className={styles.taskPanel}>
            <div className={styles.panelHeader}>
              <h4 className={styles.panelTitle}>Available Tasks</h4>
              <div className={styles.searchField}>
                <Input
                  value={taskSearchTerm}
                  onChange={(e) => setTaskSearchTerm(e.target.value)}
                  placeholder="Search tasks..."
                  className={styles.searchInput}
                />
              </div>
            </div>
            
            <div className={styles.taskList}>
              {getFilteredAvailableTasks().map(task => (
                <div key={task.id} className={styles.taskItem}>
                  <div className={styles.taskInfo}>
                    <div className={styles.taskName}>{task.name}</div>
                    <div className={styles.taskMeta}>
                      {task.instruction.name} • {task.requestType.name} • {formatFrequency(task.repeatEnum)}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => addTask(task.id)}
                    className={styles.addButton}
                  >
                    Add
                  </Button>
                </div>
              ))}
              
              {getFilteredAvailableTasks().length === 0 && (
                <div className={styles.emptyState}>
                  {taskSearchTerm ? 'No tasks match your search' : 'No available tasks'}
                </div>
              )}
            </div>
          </div>

          {/* Selected Tasks Panel */}
          <div className={styles.taskPanel}>
            <div className={styles.panelHeader}>
              <h4 className={styles.panelTitle}>
                Selected Tasks ({selectedTaskIds.length})
              </h4>
            </div>
            
            <div className={styles.taskList}>
              {getSelectedTasks().map(task => (
                <div key={task.id} className={cx(styles.taskItem, styles.selectedTask)}>
                  <div className={styles.taskInfo}>
                    <div className={styles.taskName}>{task.name}</div>
                    <div className={styles.taskMeta}>
                      {task.instruction.name} • {task.requestType.name} • {formatFrequency(task.repeatEnum)}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => removeTask(task.id)}
                    className={styles.removeButton}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              
              {selectedTaskIds.length === 0 && (
                <div className={styles.emptyState}>
                  No tasks selected. Add tasks from the left panel.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading || !formData.name.trim()}
        >
          {isLoading ? 'Saving...' : pmTemplate ? 'Update PM Template' : 'Create PM Template'}
        </Button>
      </div>
    </form>
  );
};
