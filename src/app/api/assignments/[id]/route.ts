import { NextRequest } from 'next/server';
import { validateAdminToken, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!validateAdminToken(request)) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    const assignmentId = parseInt(id);

    if (isNaN(assignmentId)) {
      return errorResponse('Invalid assignment ID', 400);
    }

    // Check if assignment exists
    const existingAssignment = await prisma.pMTemplateAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        pmTemplate: { select: { name: true } },
        equipment: { 
          include: { 
            building: { select: { name: true } } 
          }
        }
      }
    });

    if (!existingAssignment) {
      return errorResponse('Assignment not found', 404);
    }

    // Delete the assignment
    await prisma.pMTemplateAssignment.delete({
      where: { id: assignmentId }
    });

    return successResponse({ 
      message: `Removed assignment of "${existingAssignment.pmTemplate.name}" from ${existingAssignment.equipment.name} (${existingAssignment.equipment.building.name})`
    });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    return errorResponse('Failed to delete assignment');
  }
}
