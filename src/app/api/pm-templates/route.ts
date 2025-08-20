import { NextRequest, NextResponse } from 'next/server';
import { validateAdminToken, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  if (!validateAdminToken(request)) {
    return unauthorizedResponse();
  }

  try {

    const pmTemplates = await prisma.pMTemplate.findMany({
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
        _count: {
          select: {
            assignments: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return successResponse(pmTemplates);
  } catch (error) {
    console.error('Error fetching PM templates:', error);
    return errorResponse('Failed to fetch PM templates');
  }
}

export async function POST(request: NextRequest) {
  if (!validateAdminToken(request)) {
    return unauthorizedResponse();
  }

  try {

    const { name, description, taskTemplateIds } = await request.json();

    if (!name?.trim()) {
      return errorResponse('Name is required', 400);
    }

    // Check if name already exists
    const existingTemplate = await prisma.pMTemplate.findUnique({
      where: { name: name.trim() }
    });

    if (existingTemplate) {
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

    const pmTemplate = await prisma.pMTemplate.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        tasks: {
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

    return successResponse(pmTemplate, 201);
  } catch (error) {
    console.error('Error creating PM template:', error);
    return errorResponse('Failed to create PM template');
  }
}
