import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAdminToken, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth';

interface RouteParams {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!validateAdminToken(request)) {
    return unauthorizedResponse();
  }

  try {
    const equipmentId = parseInt(params.id);
    if (isNaN(equipmentId)) {
      return errorResponse('Invalid equipment ID', 400);
    }

    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
      include: {
        building: {
          select: {
            id: true,
            name: true,
            fmxBuildingName: true,
          }
        },
        assignments: {
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
          select: { assignments: true }
        }
      }
    });

    if (!equipment) {
      return errorResponse('Equipment not found', 404);
    }

    return successResponse(equipment);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    return errorResponse('Failed to fetch equipment');
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!validateAdminToken(request)) {
    return unauthorizedResponse();
  }

  try {
    const equipmentId = parseInt(params.id);
    if (isNaN(equipmentId)) {
      return errorResponse('Invalid equipment ID', 400);
    }

    const body = await request.json();
    const { buildingId, name, type, fmxEquipmentName } = body;

    if (!buildingId || !name || !type || !fmxEquipmentName) {
      return errorResponse('Building ID, name, type, and FMX Equipment Name are required', 400);
    }

    // Verify building exists
    const building = await prisma.building.findUnique({
      where: { id: parseInt(buildingId) }
    });

    if (!building) {
      return errorResponse('Building not found', 400);
    }

    const equipment = await prisma.equipment.update({
      where: { id: equipmentId },
      data: {
        buildingId: parseInt(buildingId),
        name: name.trim(),
        type: type.trim(),
        fmxEquipmentName: fmxEquipmentName.trim(),
      },
      include: {
        building: {
          select: {
            id: true,
            name: true,
            fmxBuildingName: true,
          }
        },
        _count: {
          select: { assignments: true }
        }
      }
    });

    return successResponse(equipment);
  } catch (error: any) {
    console.error('Error updating equipment:', error);
    
    if (error.code === 'P2002') {
      return errorResponse('Equipment with this FMX name already exists', 409);
    }
    
    if (error.code === 'P2025') {
      return errorResponse('Equipment not found', 404);
    }
    
    return errorResponse('Failed to update equipment');
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!validateAdminToken(request)) {
    return unauthorizedResponse();
  }

  try {
    const equipmentId = parseInt(params.id);
    if (isNaN(equipmentId)) {
      return errorResponse('Invalid equipment ID', 400);
    }

    // Check if equipment has assignments
    const assignmentCount = await prisma.pMTemplateAssignment.count({
      where: { equipmentId }
    });

    if (assignmentCount > 0) {
      return errorResponse('Cannot delete equipment with existing assignments', 409);
    }

    await prisma.equipment.delete({
      where: { id: equipmentId }
    });

    return successResponse({ message: 'Equipment deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting equipment:', error);
    
    if (error.code === 'P2025') {
      return errorResponse('Equipment not found', 404);
    }
    
    return errorResponse('Failed to delete equipment');
  }
}
