
/**
 * Prevents internal error messages from leaking to clients in production.
 * @param error The error object
 * @returns A sanitized error message
 */
export const safeError = (error: any): string => {
  if (process.env.NODE_ENV !== 'production') {
    return error.message || 'Unknown error';
  }
  
  // In production, we mask internal errors
  // You can add logic here to return different messages based on error type if needed
  return 'An unexpected error occurred. Please try again.';
};
