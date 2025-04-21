// src/crawler/api/errors.ts
/**
 * Request validation error
 */
export class ValidationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'ValidationError';
    this.status = status;
  }
}

/**
 * Handles errors in API requests
 * @param error - Error to handle
 * @returns Response with error details
 */
export function handleApiError(error: unknown): Response {
  console.error('API Error:', error);

  if (error instanceof ValidationError) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: error.status, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Default to 500 for other errors, but return the error message if present
  const message = (error && typeof error === 'object' && 'message' in error) ? (error as any).message : String(error);
  return new Response(
    JSON.stringify({ error: message }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  );
}