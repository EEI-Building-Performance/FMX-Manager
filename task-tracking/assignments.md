# PM Template Assignments Module

## Overview
The Assignments module allows users to assign PM Templates to specific equipment in buildings. This is the final step in the maintenance planning workflow, connecting templates to actual physical assets.

## Status: ✅ Completed

## Requirements Implementation

### ✅ Core Features
- [x] Template-first workflow (user picks template, then assigns equipment)
- [x] View current assignments for selected template
- [x] Remove existing assignments with confirmation
- [x] Add new assignments by building and equipment selection
- [x] Equipment filtering by type for quick sorting
- [x] Bulk assignment capabilities
- [x] Assignment settings (users, outsourcing, reminders)
- [x] Duplicate assignment prevention

### ✅ API Implementation
- [x] **GET /api/assignments** - List assignments with optional template filtering
- [x] **POST /api/assignments** - Create bulk assignments with validation
- [x] **DELETE /api/assignments/[id]** - Remove individual assignment
- [x] **GET /api/assignments/available-equipment** - Get equipment available for assignment

### ✅ Frontend Implementation
- [x] **AssignmentManager Component** - Comprehensive assignment management interface
  - Template selection dropdown with description preview
  - Current assignments display with removal capability
  - Building and equipment selection workflow
  - Equipment type filtering for efficient selection
  - Bulk selection with "Select All" functionality
  - Assignment settings form for additional parameters
- [x] **Assignments Page** - Clean page wrapper with proper layout

### ✅ Data Model Integration
- [x] **PMTemplateAssignment** model connecting templates to equipment
- [x] Building ID denormalization for performance
- [x] Optional assignment settings (users, outsourcing, reminders)
- [x] Comprehensive relationship management

## Technical Highlights

### Template-First Workflow
- **Guided Process**: User starts by selecting a PM template, ensuring focused assignment workflow
- **Context Awareness**: All subsequent selections are filtered based on the chosen template
- **Conflict Prevention**: Equipment already assigned to the template are excluded from selection

### Equipment Management
- **Hierarchical Selection**: Building → Equipment workflow mirrors physical organization
- **Type Filtering**: Quick filtering by equipment type (HVAC, Electrical, etc.)
- **Bulk Operations**: Select all equipment of a specific type or in a building
- **Visual Feedback**: Clear indication of selected items and assignment counts

### Assignment Interface
```typescript
// Smart equipment filtering
const getFilteredEquipment = () => {
  if (!selectedEquipmentType) return availableEquipment;
  return availableEquipment.filter(eq => eq.type === selectedEquipmentType);
};

// Bulk selection handling
const handleSelectAllEquipment = () => {
  const filteredEquipment = getFilteredEquipment();
  const allSelected = filteredEquipment.every(eq => selectedEquipmentIds.includes(eq.id));
  // Toggle selection based on current state
};
```

### Data Integrity
- **Duplicate Prevention**: API prevents assigning the same template to equipment twice
- **Relationship Validation**: Ensures PM templates and equipment exist before assignment
- **Cascade Management**: Proper handling of assignment removals
- **Building Consistency**: Building ID stored for denormalization and performance

## User Experience Features

### Progressive Disclosure
1. **Template Selection**: Start with template choice to establish context
2. **Current Assignments**: Show existing assignments for awareness
3. **Building Selection**: Choose building to narrow equipment scope
4. **Equipment Filtering**: Filter by type for efficient selection
5. **Assignment Settings**: Optional configuration for advanced users

### Visual Feedback
- **Selection Counts**: Clear indication of how many items are selected
- **Equipment Status**: Shows current assignment counts for each equipment
- **Filter Results**: Dynamic counts update based on active filters
- **Loading States**: Proper loading indicators during API operations

### Error Handling
- **Conflict Detection**: Prevents duplicate assignments with clear messaging
- **Validation**: Ensures all required data is present before submission
- **User Feedback**: Confirmation dialogs for destructive operations
- **Graceful Failures**: Meaningful error messages with recovery suggestions

## Dependencies
- ✅ PM Templates module (provides templates for assignment)
- ✅ Buildings & Equipment module (provides assignment targets)
- ✅ Instructions module (referenced through templates)
- ✅ Task Templates module (referenced through PM templates)

## API Patterns

### Query Optimization
```typescript
// Efficient assignment queries with selective includes
const assignments = await prisma.pMTemplateAssignment.findMany({
  include: {
    pmTemplate: { select: { id: true, name: true, description: true } },
    equipment: {
      include: {
        building: { select: { id: true, name: true, fmxBuildingName: true } }
      }
    }
  }
});
```

### Bulk Operations
```typescript
// Atomic bulk assignment creation
const assignments = await prisma.pMTemplateAssignment.createMany({
  data: equipmentIds.map(equipmentId => ({
    pmTemplateId: parseInt(pmTemplateId),
    equipmentId: parseInt(equipmentId),
    buildingId: eq.buildingId,
    // ... additional settings
  }))
});
```

## Next Steps
The Assignments module completes the core maintenance planning workflow. The next logical step would be to implement:

1. **Export Module** - Generate FMX-compatible Excel exports
2. **Reporting Module** - Assignment summaries and analytics
3. **Scheduling Module** - Actual maintenance schedule generation

## Files Created/Modified
- `src/app/api/assignments/route.ts` - Main assignments API
- `src/app/api/assignments/[id]/route.ts` - Individual assignment operations
- `src/app/api/assignments/available-equipment/route.ts` - Equipment availability API
- `src/components/assignments/AssignmentManager.tsx` - Main assignment component
- `src/components/assignments/AssignmentManager.module.css` - Component styles
- `src/app/assignments/page.tsx` - Assignments page
- `src/app/assignments/page.module.css` - Page styles
- `src/components/index.ts` - Component exports
- `task-tracking/assignments.md` - This documentation

## Notes
- Equipment type filtering provides significant UX improvement for large equipment inventories
- Bulk selection capabilities make large-scale assignments practical
- Template-first workflow ensures focused, contextual assignment process
- Assignment settings provide flexibility for various maintenance scenarios
- Building-based organization mirrors real-world facility management practices
