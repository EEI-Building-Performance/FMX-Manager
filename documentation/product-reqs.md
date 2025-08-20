Here’s a Product Requirements Document (PRD) structured so you can hand pieces to your dev agent as self-contained tasks. I’ve aligned it with the revised data model we agreed on (Templates as bundles of tasks, Assignments creating occurrences).

⸻

Product Requirements Document (PRD)

1. Overview

We are building a lightweight web application to generate FMX-compatible Planned Maintenance import spreadsheets.
The application will allow an admin user (single district) to:
	•	Import Buildings and Equipment (with FMX IDs/names).
	•	Define Instructions (step checklists).
	•	Define Task Templates (PM schedules linked to instructions).
	•	Group Task Templates into PM Templates (internal bundles).
	•	Assign PM Templates to Equipment (fan-out Tasks → Equipment).
	•	Export to Excel in FMX format (Instructions, Tasks, Occurrences sheets).

No multi-user support is required initially; a single admin token protects API access.

⸻

2. Users & Roles
	•	Admin (only role):
	•	Imports buildings/equipment
	•	Manages instructions, tasks, templates, assignments
	•	Runs exports

⸻

3. Data Model (core entities)
	•	Building: id, name, fmxBuildingName
	•	Equipment: id, buildingId, name, type, fmxEquipmentName
	•	RequestType: id, name (must match FMX)
	•	InstructionSet: id, name, description, steps
	•	TaskTemplate: full FMX Task definition (schedule, requestTypeId, instructionId, metadata)
	•	PMTemplate: internal bundle (group of TaskTemplates)
	•	PMTemplateTask: join table linking PMTemplate ↔ TaskTemplate
	•	PMTemplateAssignment: assignment of PMTemplate to Equipment, with users/reminders info

⸻

4. Features & Requirements

4.1 Building & Equipment Management
	•	Simple list views.

4.2 Instruction Management
	•	CRUD UI for Instruction Sets.
	•	Each has: Name*, Description, and Steps* (multi-line text, each line = a step).
	•	Names must be unique (exact match to FMX import).

4.3 Task Template Management
	•	CRUD UI for Task Templates.
	•	Fields required by FMX:
	•	Name*, Instruction (link), Request Type, Building(s), Location, First due date*, Repeat* (daily/weekly/monthly/yearly), repeat sub-fields, Exclude dates, Next due mode, Inventory, Estimated time, Notes.
	•	Validation: only allow correct frequency sub-fields based on chosen repeat type (e.g., quarterly = monthly, every 3 months).
	•	Reusable across multiple templates and equipment.

4.4 PM Template (Bundle) Management
	•	Ability to create a PM Template (e.g., “RTU Standard PM Program”).
	•	Add/remove Task Templates to/from PM Template.
	•	Optional override fields (location, est time, notes) stored in join table.
	•	View list of included tasks in each PM Template.

4.5 Assignments (PM Template → Equipment)
	•	Bulk assign a PM Template to one or more Equipment items.
	•	Collect assignment-level metadata:
	•	Assigned users (string), outsourced (bool), reminder days (before/after).
	•	Store as PMTemplateAssignment rows.
	•	Each assignment expands to TaskTemplate × Equipment pairs for export.

4.6 Export to FMX Workbook
	•	Generate Excel with 3 sheets:
	1.	Instructions: unique InstructionSets referenced.
	2.	Tasks: one row per (TaskTemplate × Building) used in assignments.
	3.	Occurrences: one row per (TaskTemplate × Equipment) assignment, with assigned users/reminders.
	•	File should be immediately downloadable.
	•	Dates formatted as YYYY-MM-DD.
	•	Only include columns relevant to Repeat type.
	•	Must validate that all FMX-required fields are present; show errors if not.

⸻

5. Non-Functional Requirements
	•	Single-tenant app (single district).
	•	Authentication via shared admin token (configured in .env).
	•	DB: MySQL on RDS (via Prisma).
	•	Export format must match FMX templates exactly.
	•	Simplicity over feature richness (focus on core flow).

⸻

6. Out of Scope (for v1)
	•	User accounts / multi-tenancy.
	•	Real-time FMX API integration.
	•	Mobile optimization (desktop use assumed).
	•	Complex inventory management.

⸻

Breakdown into Dev Tasks

Setup & Infrastructure
	•	Initialize Next.js + Prisma + MySQL project
	•	Set up .env with DATABASE_URL + ADMIN_TOKEN
	•	Create Prisma schema (as defined)
	•	Run initial migrations

Import Modules
	•	CSV upload API for Buildings
	•	CSV upload API for Equipment
	•	UI for import with validation feedback
	•	List views for Buildings + Equipment

Instruction Module
	•	API routes for CRUD Instructions
	•	React forms for Instruction (Name, Description, Steps)
	•	Validation: unique Name

Task Template Module
	•	API routes for CRUD TaskTemplates
	•	UI wizard for creating/editing (frequency logic, date pickers)
	•	Validation: frequency sub-fields
	•	Connect to Instruction + RequestType

PM Template Module
	•	API routes for CRUD PMTemplates
	•	UI for bundle management (add/remove TaskTemplates)
	•	Display tasks inside template

Assignments Module
	•	API for bulk assignment of PMTemplate → Equipment
	•	Store reminders/users/outsourced flag
	•	UI: equipment filter + bulk select + assign template
	•	View assignments

Export Module
	•	Implement export collector (gather Instructions, Tasks, Occurrences)
	•	Map Repeat enums → FMX columns
	•	Build Excel workbook with exceljs
	•	API to download file
	•	UI to select scope (by building/template) + export button

QA / Polish
	•	Error handling for missing FMX names
	•	Validation messages in forms
	•	Date formatting checks
	•	Test with real FMX template import

⸻