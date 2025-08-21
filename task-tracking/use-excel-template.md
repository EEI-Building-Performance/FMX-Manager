# Use Excel Template for Export

## Overview
Modify the export functionality to use the existing "Planned Maintenance Import.xlsx" file as a template instead of creating a new workbook from scratch.

## Status: ✅ Completed

## Changes Made

### ✅ Updated Export API Route
- **File**: `src/app/api/export/route.ts`
- **Changes**:
  - Added `path` import for file path handling
  - Load existing Excel template using `workbook.xlsx.readFile()`
  - Get existing worksheets by name instead of creating new ones
  - Clear existing data while preserving headers and formatting
  - Use `addRow([])` with array values instead of object mapping
  - Removed custom styling since template already has proper formatting

### ✅ Benefits
- **Exact Compatibility**: Uses the exact same file structure/formatting that FMX expects
- **Preserved Styling**: Maintains all original formatting, colors, and column widths
- **Reduced Complexity**: No need to manually recreate headers and styling
- **Future-Proof**: If FMX updates their template, we just replace the file

## Technical Details

### Template Location
- **Path**: `public/Planned Maintenance Import.xlsx` (copied from `documentation/`)
- **Accessed via**: `path.join(process.cwd(), 'public', 'Planned Maintenance Import.xlsx')`

### Sheet Names Expected
- `Instructions`
- `Time-based tasks` 
- `Occurrences`

### Data Population Method
- Clear existing data from row 2 onwards (preserve headers)
- Add data using `addRow([value1, value2, ...])` in column order
- Maintain exact column order as defined in template

## Testing Required
- [x] Move template file to accessible location (`public/` directory)
- [x] Add error handling for template file loading
- [ ] Verify template file loads correctly
- [ ] Confirm all three sheets are found
- [ ] Test data population with various scenarios
- [ ] Validate exported file opens correctly in Excel
- [ ] Ensure FMX import compatibility

## Recent Changes
- **Fixed File Access**: Moved template from `documentation/` to `public/` directory for proper Next.js access
- **Added Error Handling**: Template loading now has try/catch with descriptive error messages
