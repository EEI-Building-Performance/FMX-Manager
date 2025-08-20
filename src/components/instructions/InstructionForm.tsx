'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DeleteIcon } from '@/components/icons/Icon';
import cls from './InstructionForm.module.css';

interface InstructionStep {
  id?: number;
  text: string;
  orderIndex: number;
}

interface Instruction {
  id?: number;
  name: string;
  description?: string;
  steps: InstructionStep[];
}

interface InstructionFormProps {
  instruction?: Instruction;
  onSubmit: (data: Omit<Instruction, 'id'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function InstructionForm({ 
  instruction, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: InstructionFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [steps, setSteps] = useState<Array<{ text: string; tempId: string }>>([
    { text: '', tempId: 'step-1' }
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (instruction) {
      setFormData({
        name: instruction.name,
        description: instruction.description || '',
      });
      setSteps(
        instruction.steps.map((step, index) => ({
          text: step.text,
          tempId: `step-${index + 1}`
        }))
      );
    }
  }, [instruction]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Instruction name is required';
    }

    const nonEmptySteps = steps.filter(step => step.text.trim());
    if (nonEmptySteps.length === 0) {
      newErrors.steps = 'At least one step is required';
    }

    // Check for empty steps in the middle
    steps.forEach((step, index) => {
      if (!step.text.trim()) {
        newErrors[`step-${index}`] = 'Step cannot be empty';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const validSteps = steps
      .filter(step => step.text.trim())
      .map((step, index) => ({
        text: step.text.trim(),
        orderIndex: index
      }));

    try {
      await onSubmit({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        steps: validSteps,
      });
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleStepChange = (index: number, value: string) => {
    setSteps(prev => prev.map((step, i) => 
      i === index ? { ...step, text: value } : step
    ));
    if (errors[`step-${index}`] || errors.steps) {
      setErrors(prev => ({ 
        ...prev, 
        [`step-${index}`]: '',
        steps: ''
      }));
    }
  };

  const addStep = () => {
    setSteps(prev => [...prev, { 
      text: '', 
      tempId: `step-${Date.now()}` 
    }]);
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(prev => prev.filter((_, i) => i !== index));
    }
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= steps.length) return;

    setSteps(prev => {
      const newSteps = [...prev];
      [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];
      return newSteps;
    });
  };

  return (
    <form onSubmit={handleSubmit} className={cls.form}>
      <div className={cls.fields}>
        <Input
          label="Instruction Name"
          value={formData.name}
          onChange={handleInputChange('name')}
          error={errors.name}
          isRequired
          disabled={isLoading}
          placeholder="e.g., Monthly HVAC Filter Check"
        />
        
        <Input
          label="Description"
          value={formData.description}
          onChange={handleInputChange('description')}
          error={errors.description}
          disabled={isLoading}
          placeholder="Optional description of this instruction set"
        />

        <div className={cls.stepsSection}>
          <div className={cls.stepsHeader}>
            <label className={cls.stepsLabel}>
              Steps <span className={cls.required}>*</span>
            </label>
            {errors.steps && <span className={cls.errorText}>{errors.steps}</span>}
          </div>

          <div className={cls.stepsList}>
            {steps.map((step, index) => (
              <div key={step.tempId} className={cls.stepItem}>
                <div className={cls.stepNumber}>{index + 1}</div>
                
                <div className={cls.stepInput}>
                  <Input
                    value={step.text}
                    onChange={(e) => handleStepChange(index, e.target.value)}
                    error={errors[`step-${index}`]}
                    disabled={isLoading}
                    placeholder={`Step ${index + 1}`}
                  />
                </div>

                <div className={cls.stepActions}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => moveStep(index, 'up')}
                    disabled={index === 0 || isLoading}
                    className={cls.moveButton}
                    title="Move up"
                  >
                    ↑
                  </Button>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => moveStep(index, 'down')}
                    disabled={index === steps.length - 1 || isLoading}
                    className={cls.moveButton}
                    title="Move down"
                  >
                    ↓
                  </Button>

                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => removeStep(index)}
                    disabled={steps.length === 1 || isLoading}
                    className={cls.iconButton}
                    title="Remove step"
                  >
                    <DeleteIcon size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={addStep}
            disabled={isLoading}
            className={cls.addStepButton}
          >
            + Add Step
          </Button>
        </div>
      </div>

      <div className={cls.actions}>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={isLoading}
        >
          {instruction ? 'Update Instruction' : 'Create Instruction'}
        </Button>
      </div>
    </form>
  );
}
