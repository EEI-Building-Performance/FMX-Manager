import { NextRequest, NextResponse } from 'next/server';
import { validateAdminToken, errorResponse, successResponse, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateExportData, formatValidationErrors } from '@/lib/exportValidation';

interface ExportRequest {
  buildingIds?: number[];
  equipmentIds?: number[];
  includeAllEquipment?: boolean;
}

export async function POST(request: NextRequest) {
  const isValid = validateAdminToken(request);
  if (!isValid) {
    return unauthorizedResponse();
  }

  try {
    const body: ExportRequest = await request.json();
    const { buildingIds, equipmentIds, includeAllEquipment } = body;

    // Build equipment filter (same logic as export)
    let equipmentFilter: any = {};
    
    if (includeAllEquipment) {
      equipmentFilter = {};
    } else if (equipmentIds && equipmentIds.length > 0) {
      equipmentFilter = { id: { in: equipmentIds } };
    } else if (buildingIds && buildingIds.length > 0) {
      equipmentFilter = { buildingId: { in: buildingIds } };
    } else {
      return errorResponse('No buildings or equipment specified for validation');
    }

    // Get assignments (same query as export)
    const assignments = await prisma.pMTemplateAssignment.findMany({
      where: {
        equipment: equipmentFilter
      },
      include: {
        pmTemplate: {
          include: {
            tasks: {
              include: {
                taskTemplate: {
                  include: {
                    instruction: {
                      include: {
                        steps: {
                          orderBy: { orderIndex: 'asc' }
                        }
                      }
                    },
                    requestType: true
                  }
                }
              }
            }
          }
        },
        equipment: {
          include: {
            building: true
          }
        }
      }
    });

    if (assignments.length === 0) {
      return errorResponse('No assignments found for the specified criteria');
    }

    // Validate export data
    const validationResult = validateExportData(assignments);
    
    return successResponse({
      isValid: validationResult.isValid,
      errors: validationResult.errors,
      assignmentCount: assignments.length,
      taskCount: new Set(assignments.flatMap(a => a.pmTemplate.tasks.map(t => t.taskTemplate.id))).size,
      instructionCount: new Set(assignments.flatMap(a => a.pmTemplate.tasks.map(t => t.taskTemplate.instruction.id))).size,
      equipmentCount: new Set(assignments.map(a => a.equipment.id)).size,
      buildingCount: new Set(assignments.map(a => a.equipment.building.id)).size
    });

  } catch (error) {
    console.error('Validation error:', error);
    return errorResponse('Failed to validate export data');
  }
}
