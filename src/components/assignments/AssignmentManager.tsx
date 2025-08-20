'use client';

import React, { useState, useEffect } from 'react';
import { Button, Input, Select } from '@/components';
import { useApi, apiClient } from '@/hooks/useApi';
import { cx } from '@/utils/cx';
import styles from './AssignmentManager.module.css';

interface PMTemplate {
  id: number;
  name: string;
  description: string | null;
}

interface Building {
  id: number;
  name: string;
  fmxBuildingName: string;
}

interface Equipment {
  id: number;
  name: string;
  type: string;
  fmxEquipmentName: string;
  building: Building;
  _count: {
    assignments: number;
  };
}

interface Assignment {
  id: number;
  pmTemplate: PMTemplate;
  equipment: Equipment;
  assignedUsers: string | null;
  outsourced: boolean;
  remindBeforeDaysPrimary: number | null;
  remindBeforeDaysSecondary: number | null;
  remindAfterDays: number | null;
}

export const AssignmentManager: React.FC = () => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [pmTemplates, setPMTemplates] = useState<PMTemplate[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  const [availableEquipment, setAvailableEquipment] = useState<Equipment[]>([]);
  const [equipmentTypes, setEquipmentTypes] = useState<string[]>([]);
  const [selectedEquipmentType, setSelectedEquipmentType] = useState<string>('');
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<number[]>([]);
  const [assignmentSettings, setAssignmentSettings] = useState({
    assignedUsers: '',
    outsourced: false,
    remindBeforeDaysPrimary: '',
    remindBeforeDaysSecondary: '',
    remindAfterDays: ''
  });

  const fetchTemplates = useApi(() => apiClient.get<PMTemplate[]>('/api/pm-templates'));
  const fetchBuildings = useApi(() => apiClient.get<Building[]>('/api/buildings'));
  const fetchAssignments = useApi((pmTemplateId: number) => 
    apiClient.get<Assignment[]>(`/api/assignments?pmTemplateId=${pmTemplateId}`)
  );
  const fetchAvailableEquipment = useApi((buildingId: number, pmTemplateId?: number) =>
    apiClient.get<{equipment: Equipment[], equipmentTypes: string[]}>(`/api/assignments/available-equipment?buildingId=${buildingId}${pmTemplateId ? `&pmTemplateId=${pmTemplateId}` : ''}`)
  );
  const createAssignments = useApi((data: any) => apiClient.post('/api/assignments', data));
  const deleteAssignment = useApi((id: number) => apiClient.delete(`/api/assignments/${id}`));

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedTemplateId) {
      loadAssignments();
    } else {
      setAssignments([]);
    }
  }, [selectedTemplateId]);

  useEffect(() => {
    if (selectedBuildingId && selectedTemplateId) {
      loadAvailableEquipment();
    } else {
      setAvailableEquipment([]);
      setEquipmentTypes([]);
    }
    setSelectedEquipmentIds([]);
    setSelectedEquipmentType('');
  }, [selectedBuildingId, selectedTemplateId]);

  const loadInitialData = async () => {
    try {
      const [templatesData, buildingsData] = await Promise.all([
        fetchTemplates.execute(),
        fetchBuildings.execute()
      ]);
      setPMTemplates(templatesData || []);
      setBuildings(buildingsData || []);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const loadAssignments = async () => {
    if (!selectedTemplateId) return;
    
    try {
      const data = await fetchAssignments.execute(selectedTemplateId);
      setAssignments(data || []);
    } catch (error) {
      console.error('Error loading assignments:', error);
      setAssignments([]);
    }
  };

  const loadAvailableEquipment = async () => {
    if (!selectedBuildingId || !selectedTemplateId) return;

    try {
      const data = await fetchAvailableEquipment.execute(selectedBuildingId, selectedTemplateId);
      setAvailableEquipment(data.equipment || []);
      setEquipmentTypes(data.equipmentTypes || []);
    } catch (error) {
      console.error('Error loading available equipment:', error);
    }
  };

  const handleTemplateChange = (value: string) => {
    const templateId = value ? parseInt(value) : null;
    setSelectedTemplateId(templateId);
    setSelectedBuildingId(null);
    setSelectedEquipmentIds([]);
    setSelectedEquipmentType('');
  };

  const handleEquipmentSelection = (equipmentId: number, checked: boolean) => {
    if (checked) {
      setSelectedEquipmentIds(prev => [...prev, equipmentId]);
    } else {
      setSelectedEquipmentIds(prev => prev.filter(id => id !== equipmentId));
    }
  };

  const handleSelectAllEquipment = () => {
    const filteredEquipment = getFilteredEquipment();
    const allSelected = (filteredEquipment || []).every(eq => selectedEquipmentIds.includes(eq.id));
    
    if (allSelected) {
      // Deselect all filtered equipment
      const filteredIds = (filteredEquipment || []).map(eq => eq.id);
      setSelectedEquipmentIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      // Select all filtered equipment
      const newIds = (filteredEquipment || []).map(eq => eq.id);
      setSelectedEquipmentIds(prev => [...new Set([...prev, ...newIds])]);
    }
  };

  const handleCreateAssignments = async () => {
    if (!selectedTemplateId || selectedEquipmentIds.length === 0) return;

    try {
      await createAssignments.execute({
        pmTemplateId: selectedTemplateId,
        equipmentIds: selectedEquipmentIds,
        ...assignmentSettings,
        remindBeforeDaysPrimary: assignmentSettings.remindBeforeDaysPrimary || null,
        remindBeforeDaysSecondary: assignmentSettings.remindBeforeDaysSecondary || null,
        remindAfterDays: assignmentSettings.remindAfterDays || null
      });

      // Reset form and reload data
      setSelectedEquipmentIds([]);
      setAssignmentSettings({
        assignedUsers: '',
        outsourced: false,
        remindBeforeDaysPrimary: '',
        remindBeforeDaysSecondary: '',
        remindAfterDays: ''
      });
      
      await Promise.all([loadAssignments(), loadAvailableEquipment()]);
    } catch (error) {
      console.error('Error creating assignments:', error);
      alert('Failed to create assignments');
    }
  };

  const handleDeleteAssignment = async (assignment: Assignment) => {
    if (!confirm(`Remove assignment of "${assignment.pmTemplate.name}" from ${assignment.equipment.name}?`)) {
      return;
    }

    try {
      await deleteAssignment.execute(assignment.id);
      await Promise.all([loadAssignments(), loadAvailableEquipment()]);
    } catch (error) {
      console.error('Error deleting assignment:', error);
      alert('Failed to remove assignment');
    }
  };

  const getFilteredEquipment = () => {
    if (!selectedEquipmentType) return availableEquipment || [];
    return (availableEquipment || []).filter(eq => eq.type === selectedEquipmentType);
  };

  const selectedTemplate = (pmTemplates || []).find(t => t.id === selectedTemplateId);
  const selectedBuilding = (buildings || []).find(b => b.id === selectedBuildingId);
  const filteredEquipment = getFilteredEquipment();

  // Prepare options for Select components (with safe defaults)
  const templateOptions = (pmTemplates || []).map(template => ({
    value: template.id.toString(),
    label: template.name
  }));

  const buildingOptions = (buildings || []).map(building => ({
    value: building.id.toString(),
    label: building.name
  }));

  const equipmentTypeOptions = (equipmentTypes || []).map(type => ({
    value: type,
    label: type
  }));



  return (
    <div className={styles.container}>
      <div className={styles.templateSelection}>
        <h3 className={styles.sectionTitle}>Select PM Template</h3>
        <Select
          value={selectedTemplateId?.toString() || ''}
          onChange={handleTemplateChange}
          placeholder={fetchTemplates.isLoading ? "Loading templates..." : "Choose a PM template to manage assignments..."}
          className={styles.templateSelect}
          options={templateOptions}
          disabled={fetchTemplates.isLoading}
        />
        
        {fetchTemplates.isLoading && (
          <div className={styles.loadingState}>
            Loading PM templates...
          </div>
        )}
        
        {!fetchTemplates.isLoading && templateOptions.length === 0 && (
          <div className={styles.emptyState}>
            No PM templates found. Please create some PM templates first.
          </div>
        )}
        
        {selectedTemplate && (
          <div className={styles.templateInfo}>
            <h4>{selectedTemplate.name}</h4>
            {selectedTemplate.description && (
              <p className={styles.templateDescription}>{selectedTemplate.description}</p>
            )}
          </div>
        )}
      </div>

      {selectedTemplateId && (
        <>
          {/* Current Assignments */}
          <div className={styles.currentAssignments}>
            <h3 className={styles.sectionTitle}>
              Current Assignments ({assignments?.length || 0})
            </h3>
            
            {(assignments || []).length === 0 ? (
              <div className={styles.emptyState}>
                No equipment currently assigned to this template.
              </div>
            ) : (
              <div className={styles.assignmentsList}>
                {(assignments || []).map(assignment => (
                  <div key={assignment.id} className={styles.assignmentItem}>
                    <div className={styles.assignmentInfo}>
                      <div className={styles.equipmentName}>
                        {assignment.equipment.name}
                      </div>
                      <div className={styles.buildingName}>
                        {assignment.equipment.building.name}
                      </div>
                      <div className={styles.equipmentType}>
                        Type: {assignment.equipment.type}
                      </div>
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteAssignment(assignment)}
                      className={styles.removeButton}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Assignments */}
          <div className={styles.newAssignments}>
            <h3 className={styles.sectionTitle}>Add New Assignments</h3>
            
            <div className={styles.buildingSelection}>
              <label className={styles.label}>Building</label>
              <Select
                value={selectedBuildingId?.toString() || ''}
                onChange={(value) => setSelectedBuildingId(value ? parseInt(value) : null)}
                placeholder="Select a building..."
                options={buildingOptions}
              />
            </div>

            {selectedBuildingId && (
              <div className={styles.equipmentSelection}>
                <div className={styles.equipmentFilters}>
                  <div className={styles.typeFilter}>
                    <label className={styles.label}>Filter by Equipment Type</label>
                    <Select
                      value={selectedEquipmentType}
                      onChange={setSelectedEquipmentType}
                      placeholder="All equipment types"
                      options={equipmentTypeOptions}
                    />
                  </div>
                  
                  {(filteredEquipment || []).length > 0 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleSelectAllEquipment}
                      className={styles.selectAllButton}
                    >
                      {(filteredEquipment || []).every(eq => selectedEquipmentIds.includes(eq.id))
                        ? 'Deselect All'
                        : 'Select All'
                      } ({(filteredEquipment || []).length})
                    </Button>
                  )}
                </div>

                <div className={styles.equipmentList}>
                  {(filteredEquipment || []).length === 0 ? (
                    <div className={styles.emptyState}>
                      {selectedEquipmentType 
                        ? `No ${selectedEquipmentType} equipment available in ${selectedBuilding?.name}.`
                        : `No equipment available in ${selectedBuilding?.name}.`
                      }
                    </div>
                  ) : (
                    <>
                      <div className={styles.equipmentListHeader}>
                        <span>Equipment ({(filteredEquipment || []).length} available)</span>
                        {selectedEquipmentIds.length > 0 && (
                          <span className={styles.selectedCount}>
                            {selectedEquipmentIds.length} selected
                          </span>
                        )}
                      </div>
                      
                      {(filteredEquipment || []).map(equipment => (
                        <label key={equipment.id} className={styles.equipmentItem}>
                          <input
                            type="checkbox"
                            checked={selectedEquipmentIds.includes(equipment.id)}
                            onChange={(e) => handleEquipmentSelection(equipment.id, e.target.checked)}
                            className={styles.checkbox}
                          />
                          <div className={styles.equipmentDetails}>
                            <div className={styles.equipmentName}>{equipment.name}</div>
                            <div className={styles.equipmentMeta}>
                              {equipment.type} • {equipment._count.assignments} assignment(s)
                            </div>
                          </div>
                        </label>
                      ))}
                    </>
                  )}
                </div>

                {selectedEquipmentIds.length > 0 && (
                  <div className={styles.assignmentForm}>
                    <h4 className={styles.formTitle}>Assignment Settings (Optional)</h4>
                    
                    <div className={styles.formRow}>
                      <div className={styles.formField}>
                        <label className={styles.label}>Assigned Users</label>
                        <Input
                          value={assignmentSettings.assignedUsers}
                          onChange={(e) => setAssignmentSettings(prev => ({ ...prev, assignedUsers: e.target.value }))}
                          placeholder="User names or emails..."
                        />
                      </div>
                      
                      <div className={styles.formField}>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={assignmentSettings.outsourced}
                            onChange={(e) => setAssignmentSettings(prev => ({ ...prev, outsourced: e.target.checked }))}
                            className={styles.checkbox}
                          />
                          Outsourced
                        </label>
                      </div>
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formField}>
                        <label className={styles.label}>Primary Reminder (days before)</label>
                        <Input
                          type="number"
                          min="0"
                          value={assignmentSettings.remindBeforeDaysPrimary}
                          onChange={(e) => setAssignmentSettings(prev => ({ ...prev, remindBeforeDaysPrimary: e.target.value }))}
                          placeholder="e.g., 7"
                        />
                      </div>
                      
                      <div className={styles.formField}>
                        <label className={styles.label}>Secondary Reminder (days before)</label>
                        <Input
                          type="number"
                          min="0"
                          value={assignmentSettings.remindBeforeDaysSecondary}
                          onChange={(e) => setAssignmentSettings(prev => ({ ...prev, remindBeforeDaysSecondary: e.target.value }))}
                          placeholder="e.g., 3"
                        />
                      </div>
                      
                      <div className={styles.formField}>
                        <label className={styles.label}>Follow-up Reminder (days after)</label>
                        <Input
                          type="number"
                          min="0"
                          value={assignmentSettings.remindAfterDays}
                          onChange={(e) => setAssignmentSettings(prev => ({ ...prev, remindAfterDays: e.target.value }))}
                          placeholder="e.g., 2"
                        />
                      </div>
                    </div>

                    <div className={styles.formActions}>
                      <Button
                        onClick={handleCreateAssignments}
                        disabled={createAssignments.isLoading}
                        className={styles.assignButton}
                      >
                        {createAssignments.isLoading 
                          ? 'Assigning...' 
                          : `Assign Template to ${selectedEquipmentIds.length} Equipment`
                        }
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
