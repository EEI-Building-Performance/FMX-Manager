'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { cx } from '@/utils/cx';
import cls from './TaskTemplateForm.module.css';

interface Instruction {
  id: number;
  name: string;
}

interface RequestType {
  id: number;
  name: string;
}

interface TaskTemplate {
  id?: number;
  name: string;
  instructionId: number;
  requestTypeId: number;
  location?: string;
  firstDueDate: string;
  repeatEnum: string;
  // Daily
  dailyEveryXDays?: number;
  // Weekly
  weeklySun?: boolean;
  weeklyMon?: boolean;
  weeklyTues?: boolean;
  weeklyWed?: boolean;
  weeklyThur?: boolean;
  weeklyFri?: boolean;
  weeklySat?: boolean;
  weeklyEveryXWeeks?: number;
  // Monthly
  monthlyMode?: string;
  monthlyEveryXMonths?: number;
  // Yearly
  yearlyEveryXYears?: number;
  // Optional fields
  excludeFrom?: string;
  excludeThru?: string;
  nextDueMode?: string;
  inventoryNames?: string;
  inventoryQuantities?: string;
  estTimeHours?: number;
  notes?: string;
}

interface TaskTemplateFormProps {
  taskTemplate?: TaskTemplate;
  instructions: Instruction[];
  requestTypes: RequestType[];
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const repeatOptions = [
  { value: 'NEVER', label: 'Never (One-time only)' },
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY', label: 'Yearly' },
];

const monthlyModeOptions = [
  { value: 'DAY_OF_MONTH', label: 'Same day of month (e.g., 15th of each month)' },
  { value: 'DAY_OF_WEEK', label: 'Same day of week (e.g., 3rd Tuesday)' },
  { value: 'WEEKDAY_OF_MONTH', label: 'Weekday of month (e.g., 3rd weekday)' },
  { value: 'WEEKEND_DAY_OF_MONTH', label: 'Weekend day of month (e.g., 3rd weekend day)' },
];

const nextDueModeOptions = [
  { value: 'FIXED', label: 'Fixed schedule (always on calendar date)' },
  { value: 'VARIABLE', label: 'Variable (based on completion date)' },
];

export function TaskTemplateForm({ 
  taskTemplate, 
  instructions,
  requestTypes,
  onSubmit, 
  onCancel, 
  isLoading = false 
}: TaskTemplateFormProps) {
  // Basic form data
  const [formData, setFormData] = useState({
    name: '',
    instructionId: '',
    requestTypeId: '',
    location: '',
    firstDueDate: '',
    repeatEnum: 'NEVER',
  });

  // Frequency-specific data
  const [frequencyData, setFrequencyData] = useState({
    // Daily
    dailyEveryXDays: 1,
    // Weekly  
    weeklySun: false,
    weeklyMon: false,
    weeklyTues: false,
    weeklyWed: false,
    weeklyThur: false,
    weeklyFri: false,
    weeklySat: false,
    weeklyEveryXWeeks: 1,
    // Monthly
    monthlyMode: 'DAY_OF_MONTH',
    monthlyEveryXMonths: 1,
    // Yearly
    yearlyEveryXYears: 1,
  });

  // Optional/advanced fields
  const [advancedData, setAdvancedData] = useState({
    excludeFrom: '',
    excludeThru: '',
    nextDueMode: 'FIXED',
    inventoryNames: '',
    inventoryQuantities: '',
    estTimeHours: '',
    notes: '',
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load existing data if editing
  useEffect(() => {
    if (taskTemplate) {
      setFormData({
        name: taskTemplate.name,
        instructionId: taskTemplate.instructionId.toString(),
        requestTypeId: taskTemplate.requestTypeId.toString(),
        location: taskTemplate.location || '',
        firstDueDate: taskTemplate.firstDueDate.split('T')[0], // Convert to YYYY-MM-DD
        repeatEnum: taskTemplate.repeatEnum,
      });

      setFrequencyData({
        dailyEveryXDays: taskTemplate.dailyEveryXDays || 1,
        weeklySun: taskTemplate.weeklySun || false,
        weeklyMon: taskTemplate.weeklyMon || false,
        weeklyTues: taskTemplate.weeklyTues || false,
        weeklyWed: taskTemplate.weeklyWed || false,
        weeklyThur: taskTemplate.weeklyThur || false,
        weeklyFri: taskTemplate.weeklyFri || false,
        weeklySat: taskTemplate.weeklySat || false,
        weeklyEveryXWeeks: taskTemplate.weeklyEveryXWeeks || 1,
        monthlyMode: taskTemplate.monthlyMode || 'DAY_OF_MONTH',
        monthlyEveryXMonths: taskTemplate.monthlyEveryXMonths || 1,
        yearlyEveryXYears: taskTemplate.yearlyEveryXYears || 1,
      });

      setAdvancedData({
        excludeFrom: taskTemplate.excludeFrom ? taskTemplate.excludeFrom.split('T')[0] : '',
        excludeThru: taskTemplate.excludeThru ? taskTemplate.excludeThru.split('T')[0] : '',
        nextDueMode: taskTemplate.nextDueMode || 'FIXED',
        inventoryNames: taskTemplate.inventoryNames || '',
        inventoryQuantities: taskTemplate.inventoryQuantities || '',
        estTimeHours: taskTemplate.estTimeHours?.toString() || '',
        notes: taskTemplate.notes || '',
      });

      // Show advanced section if any advanced fields have values
      const hasAdvancedData = Boolean(
        taskTemplate.excludeFrom || taskTemplate.excludeThru || 
        taskTemplate.inventoryNames || taskTemplate.inventoryQuantities ||
        taskTemplate.estTimeHours || taskTemplate.notes ||
        taskTemplate.nextDueMode !== 'FIXED'
      );
      setShowAdvanced(hasAdvancedData);
    }
  }, [taskTemplate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Task name is required';
    }

    if (!formData.instructionId) {
      newErrors.instructionId = 'Instruction is required';
    }

    if (!formData.requestTypeId) {
      newErrors.requestTypeId = 'Request type is required';
    }

    if (!formData.firstDueDate) {
      newErrors.firstDueDate = 'First due date is required';
    }

    // Validate frequency-specific fields
    if (formData.repeatEnum === 'WEEKLY') {
      const hasAnyDay = Object.keys(frequencyData)
        .filter(key => key.startsWith('weekly') && key !== 'weeklyEveryXWeeks')
        .some(key => frequencyData[key as keyof typeof frequencyData]);
      
      if (!hasAnyDay) {
        newErrors.weeklyDays = 'At least one day must be selected for weekly tasks';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const submitData = {
        ...formData,
        ...frequencyData,
        ...advancedData,
        instructionId: parseInt(formData.instructionId),
        requestTypeId: parseInt(formData.requestTypeId),
      };

      await onSubmit(submitData);
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

  const handleFrequencySelectChange = (field: keyof typeof frequencyData) => (value: string) => {
    setFrequencyData(prev => ({ ...prev, [field]: value }));
    if (errors.weeklyDays) {
      setErrors(prev => ({ ...prev, weeklyDays: '' }));
    }
  };

  const handleAdvancedSelectChange = (field: keyof typeof advancedData) => (value: string) => {
    setAdvancedData(prev => ({ ...prev, [field]: value }));
  };

  const handleFrequencyChange = (field: keyof typeof frequencyData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFrequencyData(prev => ({ ...prev, [field]: value }));
    if (errors.weeklyDays) {
      setErrors(prev => ({ ...prev, weeklyDays: '' }));
    }
  };

  const handleAdvancedChange = (field: keyof typeof advancedData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setAdvancedData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const instructionOptions = instructions.map(instruction => ({
    value: instruction.id,
    label: instruction.name
  }));

  const requestTypeOptions = requestTypes.map(requestType => ({
    value: requestType.id,
    label: requestType.name
  }));

  return (
    <form onSubmit={handleSubmit} className={cls.form}>
      {/* Basic Information Section */}
      <div className={cls.section}>
        <h3 className={cls.sectionTitle}>Basic Information</h3>
        <div className={cls.fields}>
          <Input
            label="Task Name"
            value={formData.name}
            onChange={handleInputChange('name')}
            error={errors.name}
            isRequired
            disabled={isLoading}
            placeholder="e.g., Monthly Filter Check - RTU-1"
          />
          
          <Select
            label="Instruction Set"
            value={formData.instructionId}
            onChange={handleSelectChange('instructionId')}
            options={instructionOptions}
            error={errors.instructionId}
            isRequired
            disabled={isLoading}
            placeholder="Select instruction set"
          />

          <Select
            label="Request Type"
            value={formData.requestTypeId}
            onChange={handleSelectChange('requestTypeId')}
            options={requestTypeOptions}
            error={errors.requestTypeId}
            isRequired
            disabled={isLoading}
            placeholder="Select request type"
          />

          <Input
            label="Location"
            value={formData.location}
            onChange={handleInputChange('location')}
            disabled={isLoading}
            placeholder="e.g., Roof, Mechanical Room (optional)"
          />
        </div>
      </div>

      {/* Schedule Section */}
      <div className={cls.section}>
        <h3 className={cls.sectionTitle}>Schedule</h3>
        <div className={cls.fields}>
          <Input
            label="First Due Date"
            type="date"
            value={formData.firstDueDate}
            onChange={handleInputChange('firstDueDate')}
            error={errors.firstDueDate}
            isRequired
            disabled={isLoading}
          />

          <Select
            label="Repeat Frequency"
            value={formData.repeatEnum}
            onChange={handleSelectChange('repeatEnum')}
            options={repeatOptions}
            isRequired
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Frequency Details Section - Conditional */}
      {formData.repeatEnum !== 'NEVER' && (
        <div className={cls.section}>
          <h3 className={cls.sectionTitle}>Frequency Details</h3>
          
          {formData.repeatEnum === 'DAILY' && (
            <div className={cls.fields}>
              <Input
                label="Every X Days"
                type="number"
                min="1"
                max="365"
                value={frequencyData.dailyEveryXDays}
                onChange={handleFrequencyChange('dailyEveryXDays')}
                disabled={isLoading}
              />
            </div>
          )}

          {formData.repeatEnum === 'WEEKLY' && (
            <div className={cls.fields}>
              <div className={cls.weeklyDays}>
                <label className={cls.fieldLabel}>
                  Days of the Week <span className={cls.required}>*</span>
                </label>
                {errors.weeklyDays && <span className={cls.errorText}>{errors.weeklyDays}</span>}
                <div className={cls.checkboxGrid}>
                  {[
                    { key: 'weeklySun', label: 'Sunday' },
                    { key: 'weeklyMon', label: 'Monday' },
                    { key: 'weeklyTues', label: 'Tuesday' },
                    { key: 'weeklyWed', label: 'Wednesday' },
                    { key: 'weeklyThur', label: 'Thursday' },
                    { key: 'weeklyFri', label: 'Friday' },
                    { key: 'weeklySat', label: 'Saturday' },
                  ].map(({ key, label }) => (
                    <label key={key} className={cls.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={frequencyData[key as keyof typeof frequencyData] as boolean}
                        onChange={handleFrequencyChange(key as keyof typeof frequencyData)}
                        disabled={isLoading}
                        className={cls.checkbox}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
              
              <Input
                label="Every X Weeks"
                type="number"
                min="1"
                max="52"
                value={frequencyData.weeklyEveryXWeeks}
                onChange={handleFrequencyChange('weeklyEveryXWeeks')}
                disabled={isLoading}
              />
            </div>
          )}

          {formData.repeatEnum === 'MONTHLY' && (
            <div className={cls.fields}>
                              <Select
                  label="Monthly Mode"
                  value={frequencyData.monthlyMode}
                  onChange={handleFrequencySelectChange('monthlyMode')}
                  options={monthlyModeOptions}
                  disabled={isLoading}
                />
              
              <Input
                label="Every X Months"
                type="number"
                min="1"
                max="12"
                value={frequencyData.monthlyEveryXMonths}
                onChange={handleFrequencyChange('monthlyEveryXMonths')}
                disabled={isLoading}
              />
            </div>
          )}

          {formData.repeatEnum === 'YEARLY' && (
            <div className={cls.fields}>
              <Input
                label="Every X Years"
                type="number"
                min="1"
                max="10"
                value={frequencyData.yearlyEveryXYears}
                onChange={handleFrequencyChange('yearlyEveryXYears')}
                disabled={isLoading}
              />
            </div>
          )}
        </div>
      )}

      {/* Advanced Options - Collapsible */}
      <div className={cls.section}>
        <button
          type="button"
          className={cls.advancedToggle}
          onClick={() => setShowAdvanced(!showAdvanced)}
          disabled={isLoading}
        >
          <span>Advanced Options</span>
          <span className={cx(cls.toggleIcon, showAdvanced && cls.open)}>▼</span>
        </button>

        {showAdvanced && (
          <div className={cls.advancedFields}>
            <div className={cls.fields}>
              <div className={cls.dateRange}>
                <Input
                  label="Exclude From Date"
                  type="date"
                  value={advancedData.excludeFrom}
                  onChange={handleAdvancedChange('excludeFrom')}
                  disabled={isLoading}
                />
                
                <Input
                  label="Exclude Through Date"
                  type="date"
                  value={advancedData.excludeThru}
                  onChange={handleAdvancedChange('excludeThru')}
                  disabled={isLoading}
                />
              </div>

                              <Select
                  label="Next Due Mode"
                  value={advancedData.nextDueMode}
                  onChange={handleAdvancedSelectChange('nextDueMode')}
                  options={nextDueModeOptions}
                  disabled={isLoading}
                />

              <div className={cls.inventoryFields}>
                <Input
                  label="Inventory Names"
                  value={advancedData.inventoryNames}
                  onChange={handleAdvancedChange('inventoryNames')}
                  disabled={isLoading}
                  placeholder="e.g., Filter, Belts, Oil"
                />
                
                <Input
                  label="Inventory Quantities"
                  value={advancedData.inventoryQuantities}
                  onChange={handleAdvancedChange('inventoryQuantities')}
                  disabled={isLoading}
                  placeholder="e.g., 2, 1, 5 quarts"
                />
              </div>

              <Input
                label="Estimated Time (Hours)"
                type="number"
                min="0"
                step="0.25"
                value={advancedData.estTimeHours}
                onChange={handleAdvancedChange('estTimeHours')}
                disabled={isLoading}
                placeholder="e.g., 2.5"
              />

              <div className={cls.notesField}>
                <label className={cls.fieldLabel}>Notes</label>
                <textarea
                  value={advancedData.notes}
                  onChange={(e) => handleAdvancedChange('notes')(e)}
                  disabled={isLoading}
                  placeholder="Additional notes or special instructions..."
                  className={cls.textarea}
                  rows={3}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
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
          {taskTemplate ? 'Update Task Template' : 'Create Task Template'}
        </Button>
      </div>
    </form>
  );
}


