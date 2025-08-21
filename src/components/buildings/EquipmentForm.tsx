'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import cls from './EquipmentForm.module.css';

interface Equipment {
  id?: number;
  buildingId: number;
  name: string;
  type: string;
  fmxEquipmentName: string;
}

interface Building {
  id: number;
  name: string;
  fmxBuildingName: string;
}

interface EquipmentFormProps {
  equipment?: Equipment;
  buildings: Building[];
  onSubmit: (data: Omit<Equipment, 'id'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const equipmentTypes = [
  'Air Handler',
  'Boiler',
  'Chiller',
  'Heat Pump',
  'Rooftop Unit (RTU)',
  'Split System',
  'VRF System',
  'Exhaust Fan',
  'Supply Fan',
  'Return Fan',
  'Damper',
  'VAV Box',
  'Unit Heater',
  'Radiator',
  'Hot Water Heater',
  'Other'
];

export function EquipmentForm({ 
  equipment, 
  buildings,
  onSubmit, 
  onCancel, 
  isLoading = false 
}: EquipmentFormProps) {
  const [formData, setFormData] = useState({
    buildingId: '',
    name: '',
    type: '',
    fmxEquipmentName: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (equipment) {
      setFormData({
        buildingId: equipment.buildingId.toString(),
        name: equipment.name,
        type: equipment.type,
        fmxEquipmentName: equipment.fmxEquipmentName,
      });
    }
  }, [equipment]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.buildingId) {
      newErrors.buildingId = 'Building is required';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Equipment name is required';
    }

    if (!formData.type.trim()) {
      newErrors.type = 'Equipment type is required';
    }

    if (!formData.fmxEquipmentName.trim()) {
      newErrors.fmxEquipmentName = 'FMX Equipment Name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await onSubmit({
        buildingId: parseInt(formData.buildingId),
        name: formData.name.trim(),
        type: formData.type.trim(),
        fmxEquipmentName: formData.fmxEquipmentName.trim(),
      });
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSelectChange = (field: keyof typeof formData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const buildingOptions = buildings.map(building => ({
    value: building.id,
    label: building.name
  }));

  const typeOptions = equipmentTypes.map(type => ({
    value: type,
    label: type
  }));

  return (
    <form onSubmit={handleSubmit} className={cls.form}>
      <div className={cls.fields}>
        <Select
          label="Building"
          value={formData.buildingId}
          onChange={handleSelectChange('buildingId')}
          options={buildingOptions}
          error={errors.buildingId}
          isRequired
          disabled={isLoading}
          placeholder="Select a building"
        />
        
        <Input
          label="Equipment Name"
          value={formData.name}
          onChange={handleInputChange('name')}
          error={errors.name}
          isRequired
          disabled={isLoading}
          placeholder="e.g., RTU-1, Boiler A, Main Chiller"
        />

        <Select
          label="Equipment Type"
          value={formData.type}
          onChange={handleSelectChange('type')}
          options={typeOptions}
          error={errors.type}
          isRequired
          disabled={isLoading}
          placeholder="Select equipment type"
        />
        
        <Input
          label="FMX Equipment Name"
          value={formData.fmxEquipmentName}
          onChange={handleInputChange('fmxEquipmentName')}
          error={errors.fmxEquipmentName}
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
          {equipment ? 'Update Equipment' : 'Create Equipment'}
        </Button>
      </div>
    </form>
  );
}
