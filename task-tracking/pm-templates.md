# PM Templates Module

## Overview
The PM Templates module allows users to create and manage preventive maintenance template groups. PM Templates are collections of Task Templates that can be applied together to equipment.

## Status: ✅ Completed

## Requirements Implementation

### ✅ Core Features
- [x] Create PM Templates with name and description
- [x] Assign multiple Task Templates to a PM Template
- [x] Easy interface for adding/removing tasks (most common activity)
- [x] Full CRUD operations for PM Templates
- [x] Validation and error handling
- [x] Deletion protection for templates with assignments

### ✅ API Implementation
- [x] **GET /api/pm-templates** - List all PM templates with task counts
- [x] **POST /api/pm-templates** - Create new PM template with task assignments
- [x] **GET /api/pm-templates/[id]** - Get specific PM template details
- [x] **PUT /api/pm-templates/[id]** - Update PM template and reassign tasks
- [x] **DELETE /api/pm-templates/[id]** - Delete PM template (with protection)

### ✅ Frontend Implementation
- [x] **PMTemplateForm Component** - Dual-panel interface for task assignment
  - Basic information form (name, description)
  - Available tasks panel with search functionality
  - Selected tasks panel with easy removal
  - Visual feedback for task assignments
- [x] **PM Templates Page** - Main management interface
  - Data table with task summaries and assignment counts
  - Modal-based form integration
  - Create, edit, and delete functionality

### ✅ Data Model Integration
- [x] **PMTemplate** model with name, description, tasks, assignments
- [x] **PMTemplateTask** junction table for many-to-many relationships
- [x] Support for future override functionality (location, time, notes)
- [x] Assignment counting for usage tracking

## Technical Highlights

### Task Assignment Interface
- **Dual-panel design** with available and selected tasks
- **Search functionality** across task names, instructions, and request types
- **One-click add/remove** for intuitive task management
- **Visual task information** showing instruction, request type, and frequency
- **Responsive design** adapting to mobile devices

### Data Management
- **Efficient task queries** with nested relationships
- **Atomic updates** replacing all task assignments on edit
- **Validation** ensuring task templates exist before assignment
- **Deletion protection** preventing removal of templates with equipment assignments

### User Experience
- **Progressive disclosure** showing relevant task information
- **Clear visual hierarchy** distinguishing template info from task details
- **Consistent patterns** following established UI conventions
- **Error handling** with user-friendly messages

## Dependencies
- ✅ Task Templates module (provides tasks to assign)
- ✅ Instructions module (referenced in task display)
- ✅ Request Types module (referenced in task display)
- ✅ Buildings & Equipment module (for future assignments)

## Next Steps
The next logical step would be to implement the **PM Template Assignments** module, which will allow users to assign PM Templates to specific equipment in buildings.

## Files Created/Modified
- `src/app/api/pm-templates/route.ts` - Main API routes
- `src/app/api/pm-templates/[id]/route.ts` - Individual template routes
- `src/components/pm-templates/PMTemplateForm.tsx` - Form component
- `src/components/pm-templates/PMTemplateForm.module.css` - Form styles
- `src/app/pm-templates/page.tsx` - Main page component
- `src/app/pm-templates/page.module.css` - Page styles
- `src/components/index.ts` - Component exports
- `task-tracking/pm-templates.md` - This documentation

## Notes
- Task order within templates is not managed (per requirements)
- Override functionality in PMTemplateTask is prepared but not implemented in UI
- Assignment count is displayed but assignment management is deferred to next module
- Search functionality works across multiple task fields for better usability
