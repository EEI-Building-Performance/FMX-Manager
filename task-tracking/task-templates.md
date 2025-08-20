# Task Templates Module

## Task Overview
Implement the Task Templates management interface with dynamic form that guides users through complex field requirements while hiding unnecessary complexity.

## Requirements
- [x] Create API routes for TaskTemplate CRUD operations
- [x] Create API routes for RequestType management
- [x] Create dynamic task template form with conditional fields
- [x] Build task templates list and management UI
- [x] Implement frequency-based field visibility logic
- [x] Create collapsible optional fields section
- [x] Unique name validation
- [x] Integration with Instructions and RequestTypes
- [x] FMX-compatible field validation

## Data Model (from Prisma schema)
**Required Fields:**
- name (unique), instructionId, requestTypeId, firstDueDate, repeatEnum

**Conditional Fields (based on repeatEnum):**
- Daily: dailyEveryXDays
- Weekly: weeklySun-weeklySat, weeklyEveryXWeeks
- Monthly: monthlyMode, monthlyEveryXMonths  
- Yearly: yearlyEveryXYears

**Optional Fields (collapsed by default):**
- location, excludeFrom/excludeThru, nextDueMode, inventoryNames/inventoryQuantities, estTimeHours, notes

## Key Design Principles
- **Progressive disclosure**: Show only relevant fields based on selections
- **Optional fields hidden**: User must actively choose to fill optional fields
- **Clear guidance**: Visual cues for required vs optional
- **Validation**: Prevent invalid frequency combinations
- **FMX compatibility**: Ensure field combinations work for export

## Progress
- **Status**: Completed
- **Current Step**: All core functionality implemented

## Completed Features
- ✅ Comprehensive API routes with proper validation
- ✅ RequestType management for dropdown population
- ✅ Dynamic form with sectioned layout
- ✅ Progressive disclosure of frequency-specific fields
- ✅ Collapsible advanced options section
- ✅ Smart frequency formatting in data table
- ✅ Comprehensive validation for all frequency types
- ✅ Integration with Instructions and RequestTypes
- ✅ Deletion protection for used templates
- ✅ Mobile-responsive design
- ✅ Professional UI with clear visual hierarchy

## Implementation Notes
- Multi-step or sectioned form approach
- Dynamic field visibility based on repeat frequency
- Collapsible "Advanced Options" section for optional fields
- Clear visual distinction between required and optional
- Real-time validation for frequency-specific fields
