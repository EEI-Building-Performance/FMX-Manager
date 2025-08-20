'use client';

import React, { useState, useEffect } from 'react';
import { 
  AppLayout, 
  DataTable, 
  Modal 
} from '@/components';
import { InstructionForm } from '@/components/instructions/InstructionForm';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { useApi, apiClient } from '@/hooks/useApi';
import type { Column } from '@/components/ui/DataTable';
import styles from './page.module.css';

interface InstructionStep {
  id: number;
  text: string;
  orderIndex: number;
}

interface Instruction {
  id: number;
  name: string;
  description?: string;
  steps: InstructionStep[];
  _count: {
    steps: number;
    tasks: number;
  };
}

export default function InstructionsPage() {
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [selectedInstruction, setSelectedInstruction] = useState<Instruction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchInstructions = useApi(() => apiClient.get<Instruction[]>('/api/instructions'));
  const createInstruction = useApi((data: any) => apiClient.post('/api/instructions', data));
  const updateInstruction = useApi((id: number, data: any) => apiClient.put(`/api/instructions/${id}`, data));
  const deleteInstruction = useApi((id: number) => apiClient.delete(`/api/instructions/${id}`));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await fetchInstructions.execute();
      setInstructions(data);
    } catch (error) {
      console.error('Failed to load instructions:', error);
    }
  };

  const handleCreate = () => {
    setSelectedInstruction(null);
    setIsModalOpen(true);
  };

  const handleEdit = (instruction: Instruction) => {
    setSelectedInstruction(instruction);
    setIsModalOpen(true);
  };

  const handleDelete = async (instruction: Instruction) => {
    if (instruction._count.tasks > 0) {
      alert('Cannot delete instruction that is used by task templates. Please remove all task template references first.');
      return;
    }

    if (confirm(`Are you sure you want to delete "${instruction.name}"? This will also delete all ${instruction._count.steps} steps.`)) {
      try {
        await deleteInstruction.execute(instruction.id);
        await loadData();
      } catch (error: any) {
        alert(error.message || 'Failed to delete instruction');
      }
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      if (selectedInstruction) {
        await updateInstruction.execute(selectedInstruction.id, data);
      } else {
        await createInstruction.execute(data);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to save instruction');
      throw error;
    }
  };

  const columns: Column<Instruction>[] = [
    {
      key: 'name',
      header: 'Instruction Name',
      sortable: true,
    },
    {
      key: 'description',
      header: 'Description',
      render: (instruction) => instruction.description || '-',
    },
    {
      key: '_count.steps',
      header: 'Steps',
      render: (instruction) => instruction._count.steps.toString(),
    },
    {
      key: '_count.tasks',
      header: 'Used by Tasks',
      render: (instruction) => instruction._count.tasks.toString(),
    },
    {
      key: 'steps',
      header: 'Preview',
      render: (instruction) => (
        <div className={styles.stepsPreview}>
          {instruction.steps.slice(0, 2).map((step, index) => (
            <div key={step.id} className={styles.stepPreview}>
              {index + 1}. {step.text.length > 40 ? `${step.text.substring(0, 40)}...` : step.text}
            </div>
          ))}
          {instruction.steps.length > 2 && (
            <div className={styles.moreSteps}>
              +{instruction.steps.length - 2} more steps
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <AuthProvider>
      <AppLayout title="Instructions">
        <div className={styles.container}>
          <DataTable
            data={instructions}
            columns={columns}
            onAdd={handleCreate}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isLoading={fetchInstructions.isLoading}
            title="Instruction Sets"
            emptyMessage="No instruction sets found. Create your first instruction set to get started."
          />

          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={selectedInstruction ? 'Edit Instruction Set' : 'Create New Instruction Set'}
            size="lg"
          >
            <InstructionForm
              instruction={selectedInstruction || undefined}
              onSubmit={handleSubmit}
              onCancel={() => setIsModalOpen(false)}
              isLoading={createInstruction.isLoading || updateInstruction.isLoading}
            />
          </Modal>
        </div>
      </AppLayout>
    </AuthProvider>
  );
}
