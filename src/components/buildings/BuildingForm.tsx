'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import cls from './BuildingForm.module.css';

interface Building {
  id?: number;
  name: string;
  fmxBuildingName: string;
}

interface BuildingFormProps {
  building?: Building;
  onSubmit: (data: Omit<Building, 'id'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function BuildingForm({ 
  building, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: BuildingFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    fmxBuildingName: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (building) {
      setFormData({
        name: building.name,
        fmxBuildingName: building.fmxBuildingName,
      });
    }
  }, [building]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Building name is required';
    }

    if (!formData.fmxBuildingName.trim()) {
      newErrors.fmxBuildingName = 'FMX Building Name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await onSubmit({
        name: formData.name.trim(),
        fmxBuildingName: formData.fmxBuildingName.trim(),
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

  return (
    <form onSubmit={handleSubmit} className={cls.form}>
      <div className={cls.fields}>
        <Input
          label="Building Name"
          value={formData.name}
          onChange={handleInputChange('name')}
          error={errors.name}
          isRequired
          disabled={isLoading}
          placeholder="e.g., Main Building, Gymnasium"
        />
        
        <Input
          label="FMX Building Name"
          value={formData.fmxBuildingName}
          onChange={handleInputChange('fmxBuildingName')}
          error={errors.fmxBuildingName}
          isRequired
          disabled={isLoading}
          placeholder="Exact name as it appears in FMX"
        />
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
          {building ? 'Update Building' : 'Create Building'}
        </Button>
      </div>
    </form>
  );
}
