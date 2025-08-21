interface ValidationError {
  field: string;
  message: string;
  item?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

interface InstructionStep {
  id: number;
  orderIndex: number;
  instructionSetId: number;
  text: string;
}

interface Instruction {
  id: number;
  name: string;
  description?: string | null;
  steps: InstructionStep[];
}

interface RequestType {
  id: number;
  name: string;
}

interface TaskTemplate {
  id: number;
  name: string;
  firstDueDate: string | Date;
  repeatEnum: string;
  dailyEveryXDays?: number | null;
  weeklyEveryXWeeks?: number | null;
  weeklySun?: boolean | null;
  weeklyMon?: boolean | null;
  weeklyTues?: boolean | null;
  weeklyWed?: boolean | null;
  weeklyThur?: boolean | null;
  weeklyFri?: boolean | null;
  weeklySat?: boolean | null;
  monthlyEveryXMonths?: number | null;
  monthlyMode?: string | null;
  yearlyEveryXYears?: number | null;
  excludeFrom?: string | Date | null;
  excludeThru?: string | Date | null;
  estTimeHours?: number | null | { toString(): string };
  instruction: Instruction;
  requestType: RequestType;
}

interface PMTemplateTask {
  taskTemplate: TaskTemplate;
}

interface PMTemplate {
  tasks: PMTemplateTask[];
}

interface Building {
  id: number;
  name: string;
  fmxBuildingName: string;
}

interface Equipment {
  id: number;
  name: string;
  fmxEquipmentName: string;
  building: Building;
}

interface Assignment {
  equipment: Equipment;
  pmTemplate: PMTemplate;
}

export function validateExportData(assignments: Assignment[]): ValidationResult {
  const errors: ValidationError[] = [];

  if (assignments.length === 0) {
    return {
      isValid: false,
      errors: [{ field: 'assignments', message: 'No assignments found for export' }]
    };
  }

  // Track required data
  const checkedInstructions = new Set<number>();
  const checkedTasks = new Set<number>();
  const checkedBuildings = new Set<number>();
  const checkedEquipment = new Set<number>();

  assignments.forEach((assignment, assignmentIndex) => {
    const assignmentContext = `Assignment ${assignmentIndex + 1}`;

    // Validate equipment
    if (!checkedEquipment.has(assignment.equipment.id)) {
      checkedEquipment.add(assignment.equipment.id);
      
      if (!assignment.equipment.fmxEquipmentName || assignment.equipment.fmxEquipmentName.trim() === '') {
        errors.push({
          field: 'equipment.fmxEquipmentName',
          message: 'FMX Equipment Name is required for export',
          item: `${assignment.equipment.name} (${assignmentContext})`
        });
      }
    }

    // Validate building
    if (!checkedBuildings.has(assignment.equipment.building.id)) {
      checkedBuildings.add(assignment.equipment.building.id);
      
      if (!assignment.equipment.building.fmxBuildingName || assignment.equipment.building.fmxBuildingName.trim() === '') {
        errors.push({
          field: 'building.fmxBuildingName',
          message: 'FMX Building Name is required for export',
          item: `${assignment.equipment.building.name} (${assignmentContext})`
        });
      }
    }

    // Validate PM template tasks
    assignment.pmTemplate.tasks.forEach((pmTemplateTask, taskIndex: number) => {
      const task = pmTemplateTask.taskTemplate;
      const taskContext = `${assignmentContext}, Task ${taskIndex + 1}`;

      if (!checkedTasks.has(task.id)) {
        checkedTasks.add(task.id);

        // Required task fields
        if (!task.name || task.name.trim() === '') {
          errors.push({
            field: 'task.name',
            message: 'Task name is required',
            item: taskContext
          });
        }

        if (!task.firstDueDate) {
          errors.push({
            field: 'task.firstDueDate',
            message: 'First due date is required',
            item: `${task.name} (${taskContext})`
          });
        }

        if (!task.repeatEnum) {
          errors.push({
            field: 'task.repeatEnum',
            message: 'Repeat frequency is required',
            item: `${task.name} (${taskContext})`
          });
        }

        // Validate frequency-specific fields
        switch (task.repeatEnum) {
          case 'DAILY':
            const dailyValue = Number(task.dailyEveryXDays);
            if (!task.dailyEveryXDays || isNaN(dailyValue) || dailyValue < 1) {
              errors.push({
                field: 'task.dailyEveryXDays',
                message: 'Daily frequency requires "every X days" to be set (minimum 1)',
                item: `${task.name} (${taskContext}) - Current value: ${task.dailyEveryXDays}`
              });
            }
            break;

          case 'WEEKLY':
            const weeklyValue = Number(task.weeklyEveryXWeeks);
            if (!task.weeklyEveryXWeeks || isNaN(weeklyValue) || weeklyValue < 1) {
              errors.push({
                field: 'task.weeklyEveryXWeeks',
                message: 'Weekly frequency requires "every X weeks" to be set (minimum 1)',
                item: `${task.name} (${taskContext}) - Current value: ${task.weeklyEveryXWeeks}`
              });
            }
            
            const hasWeeklyDays = task.weeklySun || task.weeklyMon || task.weeklyTues || 
                                  task.weeklyWed || task.weeklyThur || task.weeklyFri || task.weeklySat;
            if (!hasWeeklyDays) {
              errors.push({
                field: 'task.weeklyDays',
                message: 'Weekly frequency requires at least one day of the week to be selected',
                item: `${task.name} (${taskContext})`
              });
            }
            break;

          case 'MONTHLY':
            const monthlyValue = Number(task.monthlyEveryXMonths);
            if (!task.monthlyEveryXMonths || isNaN(monthlyValue) || monthlyValue < 1) {
              errors.push({
                field: 'task.monthlyEveryXMonths',
                message: 'Monthly frequency requires "every X months" to be set (minimum 1)',
                item: `${task.name} (${taskContext}) - Current value: ${task.monthlyEveryXMonths}`
              });
            }
            
            if (!task.monthlyMode) {
              errors.push({
                field: 'task.monthlyMode',
                message: 'Monthly frequency requires a monthly mode to be selected',
                item: `${task.name} (${taskContext})`
              });
            }
            break;

          case 'YEARLY':
            const yearlyValue = Number(task.yearlyEveryXYears);
            if (!task.yearlyEveryXYears || isNaN(yearlyValue) || yearlyValue < 1) {
              errors.push({
                field: 'task.yearlyEveryXYears',
                message: 'Yearly frequency requires "every X years" to be set (minimum 1)',
                item: `${task.name} (${taskContext}) - Current value: ${task.yearlyEveryXYears}`
              });
            }
            break;
        }

        // Validate request type
        if (!task.requestType || !task.requestType.name || task.requestType.name.trim() === '') {
          errors.push({
            field: 'task.requestType',
            message: 'Request type is required and must be valid in FMX',
            item: `${task.name} (${taskContext})`
          });
        }

        // Validate instruction
        if (!task.instruction) {
          errors.push({
            field: 'task.instruction',
            message: 'Instruction set is required',
            item: `${task.name} (${taskContext})`
          });
        } else if (!checkedInstructions.has(task.instruction.id)) {
          checkedInstructions.add(task.instruction.id);

          if (!task.instruction.name || task.instruction.name.trim() === '') {
            errors.push({
              field: 'instruction.name',
              message: 'Instruction name is required',
              item: `${task.instruction.name || 'Unnamed'} (${taskContext})`
            });
          }

          if (!task.instruction.steps || task.instruction.steps.length === 0) {
            errors.push({
              field: 'instruction.steps',
              message: 'Instruction must have at least one step',
              item: `${task.instruction.name} (${taskContext})`
            });
          } else {
            // Check for empty steps
            const emptySteps = task.instruction.steps.filter((step) => 
              !step.text || step.text.trim() === ''
            );
            if (emptySteps.length > 0) {
              errors.push({
                field: 'instruction.steps',
                message: 'All instruction steps must have text',
                item: `${task.instruction.name} (${taskContext})`
              });
            }
          }
        }

        // Validate exclude dates (if provided)
        if (task.excludeFrom && task.excludeThru) {
          const fromDate = typeof task.excludeFrom === 'string' ? new Date(task.excludeFrom) : task.excludeFrom;
          const thruDate = typeof task.excludeThru === 'string' ? new Date(task.excludeThru) : task.excludeThru;
          
          if (fromDate >= thruDate) {
            errors.push({
              field: 'task.excludeDates',
              message: 'Exclude "from" date must be before "thru" date',
              item: `${task.name} (${taskContext})`
            });
          }
        }

        // Validate estimated time (if provided)
        if (task.estTimeHours !== null && task.estTimeHours !== undefined) {
          const estTimeStr = typeof task.estTimeHours === 'object' && task.estTimeHours.toString 
            ? task.estTimeHours.toString() 
            : task.estTimeHours.toString();
          const estTime = parseFloat(estTimeStr);
          if (isNaN(estTime) || estTime < 0) {
            errors.push({
              field: 'task.estTimeHours',
              message: 'Estimated time must be a positive number',
              item: `${task.name} (${taskContext})`
            });
          }
        }
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return '';

  const groupedErrors = errors.reduce((acc, error) => {
    const key = error.field;
    if (!acc[key]) acc[key] = [];
    acc[key].push(error);
    return acc;
  }, {} as Record<string, ValidationError[]>);

  let message = 'Export validation failed:\n\n';

  Object.entries(groupedErrors).forEach(([field, fieldErrors]) => {
    message += `${field}:\n`;
    fieldErrors.forEach(error => {
      message += `  • ${error.message}`;
      if (error.item) message += ` (${error.item})`;
      message += '\n';
    });
    message += '\n';
  });

  message += 'Please fix these issues before exporting.';
  
  return message;
}
