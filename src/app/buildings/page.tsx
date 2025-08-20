'use client';

import React, { useState, useEffect } from 'react';
import { 
  AppLayout, 
  DataTable, 
  Modal, 
  BuildingForm, 
  EquipmentForm,
  Button,
  Select
} from '@/components';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { useApi, apiClient } from '@/hooks/useApi';
import type { Column } from '@/components/ui/DataTable';
import styles from './page.module.css';

interface Building {
  id: number;
  name: string;
  fmxBuildingName: string;
  equipment: Array<{
    id: number;
    name: string;
    type: string;
  }>;
  _count: {
    equipment: number;
  };
}

interface Equipment {
  id: number;
  buildingId: number;
  name: string;
  type: string;
  fmxEquipmentName: string;
  building: {
    id: number;
    name: string;
    fmxBuildingName: string;
  };
  _count: {
    assignments: number;
  };
}

type ModalType = 'building' | 'equipment' | null;

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [activeTab, setActiveTab] = useState<'buildings' | 'equipment'>('buildings');
  const [selectedBuildingFilter, setSelectedBuildingFilter] = useState<string>('');

  const fetchBuildings = useApi(() => apiClient.get<Building[]>('/api/buildings'));
  const fetchEquipment = useApi(() => apiClient.get<Equipment[]>('/api/equipment'));
  const createBuilding = useApi((data: any) => apiClient.post('/api/buildings', data));
  const updateBuilding = useApi((id: number, data: any) => apiClient.put(`/api/buildings/${id}`, data));
  const deleteBuilding = useApi((id: number) => apiClient.delete(`/api/buildings/${id}`));
  const createEquipment = useApi((data: any) => apiClient.post('/api/equipment', data));
  const updateEquipment = useApi((id: number, data: any) => apiClient.put(`/api/equipment/${id}`, data));
  const deleteEquipment = useApi((id: number) => apiClient.delete(`/api/equipment/${id}`));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [buildingsData, equipmentData] = await Promise.all([
        fetchBuildings.execute(),
        fetchEquipment.execute()
      ]);
      setBuildings(buildingsData);
      setEquipment(equipmentData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleCreateBuilding = () => {
    setSelectedBuilding(null);
    setModalType('building');
  };

  const handleEditBuilding = (building: Building) => {
    setSelectedBuilding(building);
    setModalType('building');
  };

  const handleDeleteBuilding = async (building: Building) => {
    if (building._count.equipment > 0) {
      alert('Cannot delete building with existing equipment. Please remove all equipment first.');
      return;
    }

    if (confirm(`Are you sure you want to delete "${building.name}"?`)) {
      try {
        await deleteBuilding.execute(building.id);
        await loadData();
      } catch (error: any) {
        alert(error.message || 'Failed to delete building');
      }
    }
  };

  const handleCreateEquipment = () => {
    setSelectedEquipment(null);
    setModalType('equipment');
  };

  const handleEditEquipment = (equipmentItem: Equipment) => {
    setSelectedEquipment(equipmentItem);
    setModalType('equipment');
  };

  const handleDeleteEquipment = async (equipmentItem: Equipment) => {
    if (equipmentItem._count.assignments > 0) {
      alert('Cannot delete equipment with existing assignments. Please remove all assignments first.');
      return;
    }

    if (confirm(`Are you sure you want to delete "${equipmentItem.name}"?`)) {
      try {
        await deleteEquipment.execute(equipmentItem.id);
        await loadData();
      } catch (error: any) {
        alert(error.message || 'Failed to delete equipment');
      }
    }
  };

  const handleBuildingSubmit = async (data: any) => {
    try {
      if (selectedBuilding) {
        await updateBuilding.execute(selectedBuilding.id, data);
      } else {
        await createBuilding.execute(data);
      }
      setModalType(null);
      await loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to save building');
      throw error;
    }
  };

  const handleEquipmentSubmit = async (data: any) => {
    try {
      if (selectedEquipment) {
        await updateEquipment.execute(selectedEquipment.id, data);
      } else {
        await createEquipment.execute(data);
      }
      setModalType(null);
      await loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to save equipment');
      throw error;
    }
  };

  const buildingColumns: Column<Building>[] = [
    {
      key: 'name',
      header: 'Building Name',
      sortable: true,
    },
    {
      key: 'fmxBuildingName',
      header: 'FMX Name',
      sortable: true,
    },
    {
      key: '_count.equipment',
      header: 'Equipment Count',
      render: (building) => building._count.equipment.toString(),
    },
  ];

  // Filter equipment by selected building
  const filteredEquipment = selectedBuildingFilter 
    ? equipment.filter(eq => eq.buildingId === parseInt(selectedBuildingFilter))
    : equipment;

  const equipmentColumns: Column<Equipment>[] = [
    {
      key: 'name',
      header: 'Equipment Name',
      sortable: true,
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
    },
    {
      key: 'building.name',
      header: 'Building',
      sortable: true,
    },
    {
      key: 'fmxEquipmentName',
      header: 'FMX Name',
      sortable: true,
    },
    {
      key: '_count.assignments',
      header: 'Assignments',
      render: (equipment) => equipment._count.assignments.toString(),
    },
  ];

  // Building filter options
  const buildingFilterOptions = [
    { value: '', label: 'All Buildings' },
    ...buildings.map(building => ({
      value: building.id.toString(),
      label: building.name
    }))
  ];

  return (
    <AuthProvider>
      <AppLayout title="Buildings & Equipment">
        <div className={styles.container}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'buildings' ? styles.active : ''}`}
            onClick={() => setActiveTab('buildings')}
          >
            Buildings ({buildings.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'equipment' ? styles.active : ''}`}
            onClick={() => setActiveTab('equipment')}
          >
            Equipment ({equipment.length})
          </button>
        </div>

        {activeTab === 'buildings' && (
          <DataTable
            data={buildings}
            columns={buildingColumns}
            onAdd={handleCreateBuilding}
            onEdit={handleEditBuilding}
            onDelete={handleDeleteBuilding}
            isLoading={fetchBuildings.isLoading}
            title="Buildings"
            emptyMessage="No buildings found. Add your first building to get started."
          />
        )}

        {activeTab === 'equipment' && (
          <div className={styles.equipmentSection}>
            <div className={styles.equipmentFilters}>
              <Select
                label="Filter by Building"
                value={selectedBuildingFilter}
                onChange={(e) => setSelectedBuildingFilter(e.target.value)}
                options={buildingFilterOptions}
                className={styles.buildingFilter}
              />
              {selectedBuildingFilter && (
                <div className={styles.filterInfo}>
                  Showing {filteredEquipment.length} of {equipment.length} equipment items
                </div>
              )}
            </div>
            
            <DataTable
              data={filteredEquipment}
              columns={equipmentColumns}
              onAdd={handleCreateEquipment}
              onEdit={handleEditEquipment}
              onDelete={handleDeleteEquipment}
              isLoading={fetchEquipment.isLoading}
              title="Equipment"
              emptyMessage={
                selectedBuildingFilter 
                  ? "No equipment found for the selected building." 
                  : "No equipment found. Add your first equipment to get started."
              }
            />
          </div>
        )}

        <Modal
          isOpen={modalType === 'building'}
          onClose={() => setModalType(null)}
          title={selectedBuilding ? 'Edit Building' : 'Add New Building'}
          size="md"
        >
          <BuildingForm
            building={selectedBuilding || undefined}
            onSubmit={handleBuildingSubmit}
            onCancel={() => setModalType(null)}
            isLoading={createBuilding.isLoading || updateBuilding.isLoading}
          />
        </Modal>

        <Modal
          isOpen={modalType === 'equipment'}
          onClose={() => setModalType(null)}
          title={selectedEquipment ? 'Edit Equipment' : 'Add New Equipment'}
          size="md"
        >
          <EquipmentForm
            equipment={selectedEquipment || undefined}
            buildings={buildings}
            onSubmit={handleEquipmentSubmit}
            onCancel={() => setModalType(null)}
            isLoading={createEquipment.isLoading || updateEquipment.isLoading}
          />
        </Modal>
        </div>
      </AppLayout>
    </AuthProvider>
  );
}
