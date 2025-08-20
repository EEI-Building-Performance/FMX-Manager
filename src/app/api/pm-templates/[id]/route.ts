import { NextRequest, NextResponse } from 'next/server';
import { validateAdminToken, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!validateAdminToken(request)) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    const pmTemplateId = parseInt(id);

    if (isNaN(pmTemplateId)) {
      return errorResponse('Invalid PM template ID', 400);
    }

    const pmTemplate = await prisma.pMTemplate.findUnique({
      where: { id: pmTemplateId },
      include: {
        tasks: {
          include: {
            taskTemplate: {
              include: {
                instruction: true,
                requestType: true
              }
            }
          }
        },
        assignments: {
          include: {
            equipment: {
              include: {
                building: true
              }
            }
          }
        }
      }
    });

    if (!pmTemplate) {
      return errorResponse('PM template not found', 404);
    }

    return successResponse(pmTemplate);
  } catch (error) {
    console.error('Error fetching PM template:', error);
    return errorResponse('Failed to fetch PM template');
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!validateAdminToken(request)) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    const pmTemplateId = parseInt(id);

    if (isNaN(pmTemplateId)) {
      return errorResponse('Invalid PM template ID', 400);
    }

    const { name, description, taskTemplateIds } = await request.json();

    if (!name?.trim()) {
      return errorResponse('Name is required', 400);
    }

    // Check if PM template exists
    const existingTemplate = await prisma.pMTemplate.findUnique({
      where: { id: pmTemplateId }
    });

    if (!existingTemplate) {
      return errorResponse('PM template not found', 404);
    }

    // Check if name already exists (excluding current template)
    const nameConflict = await prisma.pMTemplate.findFirst({
      where: { 
        name: name.trim(),
        id: { not: pmTemplateId }
      }
    });

    if (nameConflict) {
      return errorResponse('A PM template with this name already exists', 400);
    }

    // Validate task template IDs if provided
    if (taskTemplateIds && taskTemplateIds.length > 0) {
      const taskCount = await prisma.taskTemplate.count({
        where: { id: { in: taskTemplateIds.map((id: any) => parseInt(id)) } }
      });
      
      if (taskCount !== taskTemplateIds.length) {
        return errorResponse('One or more task templates not found', 400);
      }
    }

    // Update PM template with task assignments
    const pmTemplate = await prisma.pMTemplate.update({
      where: { id: pmTemplateId },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        tasks: {
          // Delete all existing task assignments
          deleteMany: {},
          // Create new task assignments
          create: (taskTemplateIds || []).map((taskTemplateId: any) => ({
            taskTemplateId: parseInt(taskTemplateId)
          }))
        }
      },
      include: {
        tasks: {
          include: {
            taskTemplate: {
              include: {
                instruction: true,
                requestType: true
              }
            }
          }
        }
      }
    });

    return successResponse(pmTemplate);
  } catch (error) {
    console.error('Error updating PM template:', error);
    return errorResponse('Failed to update PM template');
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!validateAdminToken(request)) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    const pmTemplateId = parseInt(id);

    if (isNaN(pmTemplateId)) {
      return errorResponse('Invalid PM template ID', 400);
    }

    // Check if PM template exists
    const existingTemplate = await prisma.pMTemplate.findUnique({
      where: { id: pmTemplateId },
      include: {
        _count: {
          select: {
            assignments: true
          }
        }
      }
    });

    if (!existingTemplate) {
      return errorResponse('PM template not found', 404);
    }

    // Check if PM template has assignments
    if (existingTemplate._count.assignments > 0) {
      return errorResponse('Cannot delete PM template that is assigned to equipment. Remove all assignments first.', 400);
    }

    // Delete PM template (tasks will be deleted automatically due to cascade)
    await prisma.pMTemplate.delete({
      where: { id: pmTemplateId }
    });

    return successResponse({ message: 'PM Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting PM template:', error);
    return errorResponse('Failed to delete PM template');
  }
}
