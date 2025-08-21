'use client';

import React, { useState, useEffect } from 'react';
import { Button, Select } from '@/components';
import { useApi, apiClient } from '@/hooks/useApi';
import { cx } from '@/utils/cx';
import styles from './ExportManager.module.css';

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
}

interface ExportOptions {
  exportType: 'all' | 'buildings' | 'equipment';
  selectedBuildingIds: number[];
  selectedEquipmentIds: number[];
}

export const ExportManager: React.FC = () => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    exportType: 'all',
    selectedBuildingIds: [],
    selectedEquipmentIds: []
  });
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [allEquipment, setAllEquipment] = useState<Equipment[]>([]);
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  const fetchBuildings = useApi(() => apiClient.get<Building[]>('/api/buildings'));
  const fetchEquipment = useApi(() => apiClient.get<Equipment[]>('/api/equipment'));

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Filter equipment based on selected buildings
    if (exportOptions.exportType === 'equipment' && exportOptions.selectedBuildingIds.length > 0) {
      const filtered = allEquipment.filter(eq => 
        exportOptions.selectedBuildingIds.includes(eq.building.id)
      );
      setFilteredEquipment(filtered);
    } else {
      setFilteredEquipment(allEquipment);
    }
  }, [exportOptions.selectedBuildingIds, allEquipment, exportOptions.exportType]);

  const loadData = async () => {
    try {
      const [buildingsData, equipmentData] = await Promise.all([
        fetchBuildings.execute(),
        fetchEquipment.execute()
      ]);
      setBuildings(buildingsData || []);
      setAllEquipment(equipmentData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleExportTypeChange = (value: string) => {
    setExportOptions({
      exportType: value as 'all' | 'buildings' | 'equipment',
      selectedBuildingIds: [],
      selectedEquipmentIds: []
    });
    setValidationResult(null); // Clear validation when changing export type
  };

  const handleBuildingSelection = (buildingId: number, checked: boolean) => {
    setExportOptions(prev => ({
      ...prev,
      selectedBuildingIds: checked 
        ? [...prev.selectedBuildingIds, buildingId]
        : prev.selectedBuildingIds.filter(id => id !== buildingId)
    }));
    setValidationResult(null); // Clear validation when changing selection
  };

  const handleEquipmentSelection = (equipmentId: number, checked: boolean) => {
    setExportOptions(prev => ({
      ...prev,
      selectedEquipmentIds: checked 
        ? [...prev.selectedEquipmentIds, equipmentId]
        : prev.selectedEquipmentIds.filter(id => id !== equipmentId)
    }));
    setValidationResult(null); // Clear validation when changing selection
  };

  const handleSelectAllBuildings = () => {
    const allSelected = exportOptions.selectedBuildingIds.length === buildings.length;
    setExportOptions(prev => ({
      ...prev,
      selectedBuildingIds: allSelected ? [] : buildings.map(b => b.id)
    }));
  };

  const handleSelectAllEquipment = () => {
    const allSelected = exportOptions.selectedEquipmentIds.length === filteredEquipment.length;
    setExportOptions(prev => ({
      ...prev,
      selectedEquipmentIds: allSelected ? [] : filteredEquipment.map(eq => eq.id)
    }));
  };

  const handleValidate = async () => {
    setIsValidating(true);
    setValidationResult(null);

    try {
      const exportPayload: any = {};

      switch (exportOptions.exportType) {
        case 'all':
          exportPayload.includeAllEquipment = true;
          break;
        case 'buildings':
          if (exportOptions.selectedBuildingIds.length === 0) {
            alert('Please select at least one building');
            return;
          }
          exportPayload.buildingIds = exportOptions.selectedBuildingIds;
          break;
        case 'equipment':
          if (exportOptions.selectedEquipmentIds.length === 0) {
            alert('Please select at least one piece of equipment');
            return;
          }
          exportPayload.equipmentIds = exportOptions.selectedEquipmentIds;
          break;
      }

      const response = await fetch('/api/export/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token')}`
        },
        body: JSON.stringify(exportPayload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Validation failed');
      }

      const result = await response.json();
      setValidationResult(result);

    } catch (error) {
      console.error('Validation error:', error);
      alert(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsValidating(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const exportPayload: any = {};

      switch (exportOptions.exportType) {
        case 'all':
          exportPayload.includeAllEquipment = true;
          break;
        case 'buildings':
          if (exportOptions.selectedBuildingIds.length === 0) {
            alert('Please select at least one building');
            return;
          }
          exportPayload.buildingIds = exportOptions.selectedBuildingIds;
          break;
        case 'equipment':
          if (exportOptions.selectedEquipmentIds.length === 0) {
            alert('Please select at least one piece of equipment');
            return;
          }
          exportPayload.equipmentIds = exportOptions.selectedEquipmentIds;
          break;
      }

      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token')}`
        },
        body: JSON.stringify(exportPayload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fmx-planned-maintenance-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Export error:', error);
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const canExport = () => {
    switch (exportOptions.exportType) {
      case 'all':
        return true;
      case 'buildings':
        return exportOptions.selectedBuildingIds.length > 0;
      case 'equipment':
        return exportOptions.selectedEquipmentIds.length > 0;
      default:
        return false;
    }
  };

  const getExportSummary = () => {
    switch (exportOptions.exportType) {
      case 'all':
        return 'All equipment in all buildings';
      case 'buildings':
        const buildingCount = exportOptions.selectedBuildingIds.length;
        const equipmentInBuildings = allEquipment.filter(eq => 
          exportOptions.selectedBuildingIds.includes(eq.building.id)
        ).length;
        return `${buildingCount} building${buildingCount !== 1 ? 's' : ''} (${equipmentInBuildings} equipment items)`;
      case 'equipment':
        return `${exportOptions.selectedEquipmentIds.length} equipment item${exportOptions.selectedEquipmentIds.length !== 1 ? 's' : ''}`;
      default:
        return '';
    }
  };

  // Prepare building options
  const buildingOptions = buildings.map(building => ({
    value: building.id.toString(),
    label: building.name
  }));

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Export Scope</h3>
        <div className={styles.exportTypeSelection}>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="exportType"
              value="all"
              checked={exportOptions.exportType === 'all'}
              onChange={() => handleExportTypeChange('all')}
              className={styles.radio}
            />
            Export all equipment in all buildings
          </label>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="exportType"
              value="buildings"
              checked={exportOptions.exportType === 'buildings'}
              onChange={() => handleExportTypeChange('buildings')}
              className={styles.radio}
            />
            Export specific buildings (all equipment within)
          </label>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="exportType"
              value="equipment"
              checked={exportOptions.exportType === 'equipment'}
              onChange={() => handleExportTypeChange('equipment')}
              className={styles.radio}
            />
            Export specific equipment
          </label>
        </div>
      </div>

      {exportOptions.exportType === 'buildings' && (
        <div className={styles.section}>
          <div className={styles.selectionHeader}>
            <h3 className={styles.sectionTitle}>Select Buildings</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAllBuildings}
              className={styles.selectAllButton}
            >
              {exportOptions.selectedBuildingIds.length === buildings.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
          
          <div className={styles.selectionGrid}>
            {buildings.map(building => (
              <label key={building.id} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={exportOptions.selectedBuildingIds.includes(building.id)}
                  onChange={(e) => handleBuildingSelection(building.id, e.target.checked)}
                  className={styles.checkbox}
                />
                <div className={styles.itemDetails}>
                  <div className={styles.itemName}>{building.name}</div>
                  <div className={styles.itemMeta}>
                    {allEquipment.filter(eq => eq.building.id === building.id).length} equipment items
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {exportOptions.exportType === 'equipment' && (
        <div className={styles.section}>
          <div className={styles.filterSection}>
            <label className={styles.label}>Filter by Building (optional):</label>
            <Select
              value=""
              onChange={(value) => {
                const buildingIds = value ? [parseInt(value)] : [];
                setExportOptions(prev => ({ ...prev, selectedBuildingIds: buildingIds }));
              }}
              options={[
                { value: '', label: 'All buildings' },
                ...buildingOptions
              ]}
              className={styles.buildingFilter}
            />
          </div>

          <div className={styles.selectionHeader}>
            <h3 className={styles.sectionTitle}>
              Select Equipment ({filteredEquipment.length} available)
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAllEquipment}
              className={styles.selectAllButton}
            >
              {exportOptions.selectedEquipmentIds.length === filteredEquipment.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
          
          <div className={styles.selectionGrid}>
            {filteredEquipment.map(equipment => (
              <label key={equipment.id} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={exportOptions.selectedEquipmentIds.includes(equipment.id)}
                  onChange={(e) => handleEquipmentSelection(equipment.id, e.target.checked)}
                  className={styles.checkbox}
                />
                <div className={styles.itemDetails}>
                  <div className={styles.itemName}>{equipment.name}</div>
                  <div className={styles.itemMeta}>
                    {equipment.type} • {equipment.building.name}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className={styles.summary}>
        <h3 className={styles.sectionTitle}>Export Summary</h3>
        <div className={styles.summaryContent}>
          <div className={styles.summaryItem}>
            <strong>Scope:</strong> {getExportSummary()}
          </div>
          <div className={styles.summaryItem}>
            <strong>Format:</strong> Excel file with Instructions, Tasks, and Occurrences sheets
          </div>
          <div className={styles.summaryItem}>
            <strong>Compatibility:</strong> FMX Planned Maintenance Import format
          </div>
        </div>
      </div>

      {validationResult && (
        <div className={cx(styles.section, validationResult.isValid ? styles.validationSuccess : styles.validationError)}>
          <h3 className={styles.sectionTitle}>
            Validation Results {validationResult.isValid ? '✓' : '✗'}
          </h3>
          
          {validationResult.isValid ? (
            <div className={styles.validationContent}>
              <div className={styles.validationItem}>
                ✓ All required fields are present and valid
              </div>
              <div className={styles.validationStats}>
                <div>• {validationResult.assignmentCount} assignment(s)</div>
                <div>• {validationResult.taskCount} unique task(s)</div>
                <div>• {validationResult.instructionCount} instruction set(s)</div>
                <div>• {validationResult.equipmentCount} equipment item(s)</div>
                <div>• {validationResult.buildingCount} building(s)</div>
              </div>
            </div>
          ) : (
            <div className={styles.validationContent}>
              <div className={styles.validationItem}>
                ✗ {validationResult.errors?.length || 0} validation error(s) found:
              </div>
              <div className={styles.validationErrors}>
                {validationResult.errors?.map((error: any, index: number) => (
                  <div key={index} className={styles.validationErrorItem}>
                    <strong>{error.field}:</strong> {error.message}
                    {error.item && <div className={styles.errorContext}>→ {error.item}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className={styles.actions}>
        <Button
          onClick={handleValidate}
          disabled={!canExport() || isValidating}
          variant="secondary"
          className={styles.validateButton}
        >
          {isValidating ? 'Validating...' : 'Validate Export'}
        </Button>
        
        <Button
          onClick={handleExport}
          disabled={!canExport() || isExporting || (validationResult && !validationResult.isValid)}
          size="lg"
          className={styles.exportButton}
        >
          {isExporting ? 'Generating Export...' : 'Generate Export'}
        </Button>
      </div>
    </div>
  );
};
