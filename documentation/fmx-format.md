FMX Bulk Import – Planned Maintenance (PM) Tasks & Instructions

This summarizes how to structure Excel import files for FMX bulk upload of Planned Maintenance Tasks and Instruction Sets.

⸻

1. Instructions Tab

Required columns:
	•	Name* → Title of the instruction set (e.g., “Chillers - Monthly PM Checklist”)
	•	Steps* → Checklist of steps (each step must be on a new line using Alt+Enter)

Optional columns:
	•	Description → Notes describing the instruction set

➡️ FMX converts each step into a check-box. After import, step type/conditions can be edited in the UI.

⸻

2. Tasks Tab

Required columns:
	•	Instruction → Must match the Name in the Instructions tab
	•	Name* → Title of the PM task (e.g., “Quarterly Filter Change”)
	•	Request Type* → FMX request category (must already exist in FMX)
	•	Buildings* → FMX building names (must already exist in FMX)
	•	First due date* → Date of first occurrence (MM/DD/YYYY)
	•	Repeat* → Frequency (Never, Daily, Weekly, Monthly, Yearly)

Frequency details:
	•	Daily → every X days
	•	Weekly → choose days (Sun–Sat = Y/1), every X weeks
	•	Monthly → mode (Day of month, Day of week, Weekday of month, Weekend day of month), every X months
	•	Yearly → every X years

Optional columns:
	•	Location → Specific area (e.g., “Kitchen”)
	•	Exclude dates (From / Thru) → Skip PMs during certain periods
	•	Next due date mode → Variable (based on completion) OR Fixed (always on calendar)
	•	Inventory used (Names / Quantities) → Parts/consumables used
	•	Custom Fields → Must be set up by an FMX admin

⸻

3. Occurrences Tab

Required/Optional columns:
	•	Equipment items → List of assets (use Alt+Enter for multiple)
	•	Assigned users → FMX usernames for assignment
	•	Outsourced → Y if done by vendor
	•	Email reminders → X days before/after due date (multiple columns)

⸻

4. Import Rules
	•	Tasks must reference valid Instructions (matching name).
	•	Buildings & Request Types must already exist in FMX.
	•	Equipment, custom fields, and users must also exist before import.
	•	FMX generates unique IDs for tasks on import.
	•	Quarterly/semiannual PMs must be configured using “Monthly every 3/6 months.”

⸻