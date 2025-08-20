# Instructions Module

## Task Overview
Implement the Instructions management interface with CRUD operations for instruction sets and individual steps.

## Requirements
- [x] Create API routes for InstructionSet CRUD operations
- [ ] Create API routes for InstructionStep management (not needed - handled in main API)
- [x] Build Instructions list and management UI
- [x] Create instruction form with step management
- [ ] Implement drag-and-drop step reordering (future enhancement)
- [x] Unique name validation
- [x] Step ordering and management
- [x] Integration with TaskTemplate references

## Data Model (from Prisma schema)
- **InstructionSet**: id, name (unique), description, steps[], tasks[]
- **InstructionStep**: id, instructionSetId, orderIndex, text

## Key Considerations
- Name must be unique (validates against FMX requirements)
- Steps have orderIndex for proper sequencing
- Cascade delete for steps when instruction set is deleted
- Steps can be added, removed, reordered dynamically
- Clear interface for step management

## Progress
- **Status**: Completed
- **Current Step**: All core functionality implemented

## Completed Features
- ✅ RESTful API endpoints with proper authentication
- ✅ InstructionSet CRUD operations with step management
- ✅ Unique name validation for FMX compatibility
- ✅ Dynamic step management (add, remove, reorder)
- ✅ Step preview in data table
- ✅ Transaction-based updates for data consistency
- ✅ Deletion protection for instructions used by tasks
- ✅ Professional UI with numbered steps
- ✅ Responsive design for mobile and desktop
- ✅ Form validation and error handling

## Implementation Notes
- Using separate InstructionStep model for better data management
- Steps have orderIndex for proper ordering
- Name validation critical for FMX compatibility
- Drag-and-drop interface for step reordering
