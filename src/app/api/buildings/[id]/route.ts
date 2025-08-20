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
    const buildingId = parseInt(params.id);
    if (isNaN(buildingId)) {
      return errorResponse('Invalid building ID', 400);
    }

    const building = await prisma.building.findUnique({
      where: { id: buildingId },
      include: {
        equipment: {
          orderBy: { name: 'asc' }
        },
        _count: {
          select: { equipment: true }
        }
      }
    });

    if (!building) {
      return errorResponse('Building not found', 404);
    }

    return successResponse(building);
  } catch (error) {
    console.error('Error fetching building:', error);
    return errorResponse('Failed to fetch building');
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!validateAdminToken(request)) {
    return unauthorizedResponse();
  }

  try {
    const buildingId = parseInt(params.id);
    if (isNaN(buildingId)) {
      return errorResponse('Invalid building ID', 400);
    }

    const body = await request.json();
    const { name, fmxBuildingName } = body;

    if (!name || !fmxBuildingName) {
      return errorResponse('Name and FMX Building Name are required', 400);
    }

    const building = await prisma.building.update({
      where: { id: buildingId },
      data: {
        name: name.trim(),
        fmxBuildingName: fmxBuildingName.trim(),
      },
      include: {
        equipment: {
          select: {
            id: true,
            name: true,
            type: true,
          }
        },
        _count: {
          select: { equipment: true }
        }
      }
    });

    return successResponse(building);
  } catch (error: any) {
    console.error('Error updating building:', error);
    
    if (error.code === 'P2002') {
      return errorResponse('Building with this name or FMX name already exists', 409);
    }
    
    if (error.code === 'P2025') {
      return errorResponse('Building not found', 404);
    }
    
    return errorResponse('Failed to update building');
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!validateAdminToken(request)) {
    return unauthorizedResponse();
  }

  try {
    const buildingId = parseInt(params.id);
    if (isNaN(buildingId)) {
      return errorResponse('Invalid building ID', 400);
    }

    // Check if building has equipment
    const equipmentCount = await prisma.equipment.count({
      where: { buildingId }
    });

    if (equipmentCount > 0) {
      return errorResponse('Cannot delete building with existing equipment', 409);
    }

    await prisma.building.delete({
      where: { id: buildingId }
    });

    return successResponse({ message: 'Building deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting building:', error);
    
    if (error.code === 'P2025') {
      return errorResponse('Building not found', 404);
    }
    
    return errorResponse('Failed to delete building');
  }
}
