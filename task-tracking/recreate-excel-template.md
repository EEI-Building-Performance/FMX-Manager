# Recreate Excel Template Format

## Overview
Recreate the exact FMX Excel template format step by step instead of trying to load the template file, starting with the Instructions sheet.

## Status: ✅ Instructions & Time-based Tasks Sheets Completed

## Instructions Sheet Format

### ✅ Row Structure
- **Rows 1-2**: 
  - Column A: Merged A1:A2 (empty)
  - Columns B-C: Merged B1:C2 with "INSTRUCTIONS" text
- **Rows 3-4**: 
  - Column A: Merged A3:A4 with "Name*"
  - Column B: Merged B3:B4 with "Description" 
  - Column C: Merged C3:C4 with "Steps*"
- **Row 5+**: Data rows

### ✅ Formatting Applied
- **Column Widths**: A=30, B=50, C=80
- **Title Formatting**: "INSTRUCTIONS" - centered, bold, size 14
- **Header Formatting**: 
  - Background color: #4D50C0 (purple)
  - Text: White, bold, centered
  - Borders: Thin black borders on all sides
- **Data Formatting**: Thin borders on all data cells

### ✅ Code Implementation
- **File**: `src/app/api/export/route.ts`
- **Changes**:
  - Removed column-based headers (`instructionsSheet.columns`)
  - Added manual cell merging with `mergeCells()`
  - Applied exact color formatting with `fgColor: { argb: 'FF4D50C0' }`
  - Set proper text alignment and borders
  - Data population starts from row 5 using cell references

## Time-based Tasks Sheet Format

### ✅ Row 1-2 (Section Headers)
- **Column A**: Empty (merged A1:A2)
- **Columns B-G**: "TASK" (merged B1:G2)
- **Column H**: "DAILY" (merged H1:H2)
- **Columns I-P**: "WEEKLY" (merged I1:P2)
- **Columns Q-R**: "MONTHLY" (merged Q1:R2)
- **Column S**: "YEARLY" (merged S1:S2)
- **Columns T-BC**: "TASK" (merged T1:BC2)

### ✅ Row 3-4 (Column Headers with Color Coding)
- **Orange (#F79646)**: Instructions, Every X years
- **Red (#C0504D)**: Core task fields (Name*, Request type*, Buildings*, etc.)
- **Green (#9BBB59)**: Daily frequency (Every X days)
- **Purple (#8064A2)**: Weekly fields (Sun, Mon, Tues, etc.)
- **Blue (#4BACC6)**: Monthly fields (Mode, Every X months)
- **Special Split Headers**: 
  - "Exclude dates" splits to "From"/"Thru" 
  - "Inventory used" splits to "Names"/"Quantities"

### ✅ Implementation Details
- **Complex merged cells**: Different merge patterns for rows 1-2 vs 3-4
- **Color-coded sections**: 5 different background colors for logical grouping
- **Split headers**: Some headers span row 3 but split in row 4
- **Data mapping**: Updated to use cell references instead of column keys
- **Proper borders**: Thin borders on all cells for professional appearance

## Next Steps
- [ ] Apply same step-by-step approach to Occurrences sheet
- [ ] Test complete template recreation
- [ ] Verify FMX import compatibility

## Benefits
- **Exact Format Match**: Recreates the precise FMX template structure
- **No File Dependencies**: Eliminates issues with loading external template files
- **Full Control**: Complete control over formatting and structure
- **Reliable**: No file path or permission issues
