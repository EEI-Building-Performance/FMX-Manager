import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAdminToken, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!validateAdminToken(request)) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    const taskTemplateId = parseInt(id);
    if (isNaN(taskTemplateId)) {
      return errorResponse('Invalid task template ID', 400);
    }

    const taskTemplate = await prisma.taskTemplate.findUnique({
      where: { id: taskTemplateId },
      include: {
        instruction: {
          select: {
            id: true,
            name: true,
          }
        },
        requestType: {
          select: {
            id: true,
            name: true,
          }
        },
        pmTemplateTasks: {
          include: {
            pmTemplate: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        },
        _count: {
          select: { pmTemplateTasks: true }
        }
      }
    });

    if (!taskTemplate) {
      return errorResponse('Task template not found', 404);
    }

    return successResponse(taskTemplate);
  } catch (error) {
    console.error('Error fetching task template:', error);
    return errorResponse('Failed to fetch task template');
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!validateAdminToken(request)) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    const taskTemplateId = parseInt(id);
    if (isNaN(taskTemplateId)) {
      return errorResponse('Invalid task template ID', 400);
    }

    const body = await request.json();
    const { 
      name, 
      instructionId, 
      requestTypeId, 
      location,
      firstDueDate, 
      repeatEnum,
      // Daily fields
      dailyEveryXDays,
      // Weekly fields
      weeklySun, weeklyMon, weeklyTues, weeklyWed, weeklyThur, weeklyFri, weeklySat,
      weeklyEveryXWeeks,
      // Monthly fields
      monthlyMode,
      monthlyEveryXMonths,
      // Yearly fields
      yearlyEveryXYears,
      // Optional fields
      excludeFrom,
      excludeThru,
      nextDueMode,
      inventoryNames,
      inventoryQuantities,
      estTimeHours,
      notes
    } = body;

    // Validation
    if (!name || !instructionId || !requestTypeId || !firstDueDate || !repeatEnum) {
      return errorResponse('Name, instruction, request type, first due date, and repeat frequency are required', 400);
    }

    // Validate frequency-specific fields
    const validationError = validateFrequencyFields(repeatEnum, body);
    if (validationError) {
      return errorResponse(validationError, 400);
    }

    // Verify instruction and request type exist
    const [instruction, requestType] = await Promise.all([
      prisma.instructionSet.findUnique({ where: { id: parseInt(instructionId) } }),
      prisma.requestType.findUnique({ where: { id: parseInt(requestTypeId) } })
    ]);

    if (!instruction) {
      return errorResponse('Instruction not found', 400);
    }

    if (!requestType) {
      return errorResponse('Request type not found', 400);
    }

    const taskTemplate = await prisma.taskTemplate.update({
      where: { id: taskTemplateId },
      data: {
        name: name.trim(),
        instructionId: parseInt(instructionId),
        requestTypeId: parseInt(requestTypeId),
        location: location?.trim() || null,
        firstDueDate: new Date(firstDueDate),
        repeatEnum,
        // Clear all frequency fields first, then set the relevant ones
        dailyEveryXDays: null,
        weeklySun: null,
        weeklyMon: null,
        weeklyTues: null,
        weeklyWed: null,
        weeklyThur: null,
        weeklyFri: null,
        weeklySat: null,
        weeklyEveryXWeeks: null,
        monthlyMode: null,
        monthlyEveryXMonths: null,
        yearlyEveryXYears: null,
        // Optional fields
        excludeFrom: excludeFrom ? new Date(excludeFrom) : null,
        excludeThru: excludeThru ? new Date(excludeThru) : null,
        nextDueMode: nextDueMode || 'FIXED',
        inventoryNames: inventoryNames?.trim() || null,
        inventoryQuantities: inventoryQuantities?.trim() || null,
        estTimeHours: estTimeHours ? parseFloat(estTimeHours) : null,
        notes: notes?.trim() || null,
      },
      include: {
        instruction: {
          select: {
            id: true,
            name: true,
          }
        },
        requestType: {
          select: {
            id: true,
            name: true,
          }
        },
        _count: {
          select: { pmTemplateTasks: true }
        }
      }
    });

    // Update frequency-specific fields in a second operation
    const frequencyUpdate = getFrequencyUpdateData(repeatEnum, body);
    if (frequencyUpdate && Object.keys(frequencyUpdate).length > 0) {
      await prisma.taskTemplate.update({
        where: { id: taskTemplateId },
        data: frequencyUpdate
      });
    }

    // Fetch the updated record with all fields
    const updatedTaskTemplate = await prisma.taskTemplate.findUnique({
      where: { id: taskTemplateId },
      include: {
        instruction: {
          select: {
            id: true,
            name: true,
          }
        },
        requestType: {
          select: {
            id: true,
            name: true,
          }
        },
        _count: {
          select: { pmTemplateTasks: true }
        }
      }
    });

    return successResponse(updatedTaskTemplate);
  } catch (error: any) {
    console.error('Error updating task template:', error);
    
    if (error.code === 'P2002') {
      return errorResponse('Task template with this name already exists', 409);
    }
    
    if (error.code === 'P2025') {
      return errorResponse('Task template not found', 404);
    }
    
    return errorResponse('Failed to update task template');
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!validateAdminToken(request)) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    const taskTemplateId = parseInt(id);
    if (isNaN(taskTemplateId)) {
      return errorResponse('Invalid task template ID', 400);
    }

    // Check if task template is used by any PM templates
    const pmTemplateTaskCount = await prisma.pMTemplateTask.count({
      where: { taskTemplateId }
    });

    if (pmTemplateTaskCount > 0) {
      return errorResponse('Cannot delete task template that is used by PM templates', 409);
    }

    await prisma.taskTemplate.delete({
      where: { id: taskTemplateId }
    });

    return successResponse({ message: 'Task template deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting task template:', error);
    
    if (error.code === 'P2025') {
      return errorResponse('Task template not found', 404);
    }
    
    return errorResponse('Failed to delete task template');
  }
}

function validateFrequencyFields(repeatEnum: string, data: any): string | null {
  switch (repeatEnum) {
    case 'DAILY':
      if (data.dailyEveryXDays && (data.dailyEveryXDays < 1 || data.dailyEveryXDays > 365)) {
        return 'Daily frequency must be between 1 and 365 days';
      }
      break;
    
    case 'WEEKLY':
      const hasAnyDay = data.weeklySun || data.weeklyMon || data.weeklyTues || 
                       data.weeklyWed || data.weeklyThur || data.weeklyFri || data.weeklySat;
      if (!hasAnyDay) {
        return 'At least one day of the week must be selected for weekly tasks';
      }
      if (data.weeklyEveryXWeeks && (data.weeklyEveryXWeeks < 1 || data.weeklyEveryXWeeks > 52)) {
        return 'Weekly frequency must be between 1 and 52 weeks';
      }
      break;
    
    case 'MONTHLY':
      if (!data.monthlyMode) {
        return 'Monthly mode is required for monthly tasks';
      }
      if (!['DAY_OF_MONTH', 'DAY_OF_WEEK', 'WEEKDAY_OF_MONTH', 'WEEKEND_DAY_OF_MONTH'].includes(data.monthlyMode)) {
        return 'Invalid monthly mode';
      }
      if (data.monthlyEveryXMonths && (data.monthlyEveryXMonths < 1 || data.monthlyEveryXMonths > 12)) {
        return 'Monthly frequency must be between 1 and 12 months';
      }
      break;
    
    case 'YEARLY':
      if (data.yearlyEveryXYears && (data.yearlyEveryXYears < 1 || data.yearlyEveryXYears > 10)) {
        return 'Yearly frequency must be between 1 and 10 years';
      }
      break;
  }
  
  return null;
}

function getFrequencyUpdateData(repeatEnum: string, data: any): any {
  switch (repeatEnum) {
    case 'DAILY':
      return {
        dailyEveryXDays: parseInt(data.dailyEveryXDays) || 1
      };
    
    case 'WEEKLY':
      return {
        weeklySun: Boolean(data.weeklySun),
        weeklyMon: Boolean(data.weeklyMon),
        weeklyTues: Boolean(data.weeklyTues),
        weeklyWed: Boolean(data.weeklyWed),
        weeklyThur: Boolean(data.weeklyThur),
        weeklyFri: Boolean(data.weeklyFri),
        weeklySat: Boolean(data.weeklySat),
        weeklyEveryXWeeks: parseInt(data.weeklyEveryXWeeks) || 1
      };
    
    case 'MONTHLY':
      return {
        monthlyMode: data.monthlyMode || 'DAY_OF_MONTH',
        monthlyEveryXMonths: parseInt(data.monthlyEveryXMonths) || 1
      };
    
    case 'YEARLY':
      return {
        yearlyEveryXYears: parseInt(data.yearlyEveryXYears) || 1
      };
    
    default:
      return {};
  }
}
