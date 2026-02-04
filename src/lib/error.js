export function errorResponse(code, message, details) {
  const error = { code, message };

  if (details && typeof details === 'object') {
    error.details = details;
  }

  return { error };
}
