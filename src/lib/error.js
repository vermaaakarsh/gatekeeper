export function errorResponse(code, message, extras = {}) {
  return {
    error: {
      code,
      message,
      ...extras,
    },
  };
}
