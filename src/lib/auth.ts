import { NextRequest } from 'next/server';

/**
 * Validates admin token from request headers
 */
export function validateAdminToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const adminToken = process.env.ADMIN_TOKEN;

  if (!adminToken) {
    console.error('ADMIN_TOKEN environment variable is not set');
    return false;
  }

  if (!authHeader) {
    return false;
  }

  // Support both "Bearer TOKEN" and "TOKEN" formats
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : authHeader;

  return token === adminToken;
}

/**
 * Creates a standardized unauthorized response
 */
export function unauthorizedResponse() {
  return new Response(
    JSON.stringify({ error: 'Unauthorized access' }),
    { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Creates a standardized error response
 */
export function errorResponse(message: string, status: number = 500) {
  return new Response(
    JSON.stringify({ error: message }),
    { 
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Creates a standardized success response
 */
export function successResponse(data: unknown, status: number = 200) {
  return new Response(
    JSON.stringify(data),
    { 
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
