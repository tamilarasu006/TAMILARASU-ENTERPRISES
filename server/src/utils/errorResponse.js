const errorResponse = (res, status, message, error, errorCode = 'INTERNAL_ERROR') => {
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[ERROR ${status}] ${message}`, error?.message || error);
    if (error?.stack && process.env.NODE_ENV !== 'production') {
      console.error(error.stack);
    }
  }

  // Derive error code from known Prisma or HTTP errors if available
  let code = errorCode;
  if (status === 400) code = 'BAD_REQUEST';
  if (status === 401) code = 'UNAUTHORIZED';
  if (status === 403) code = 'FORBIDDEN';
  if (status === 404) code = 'NOT_FOUND';
  if (error?.code) code = error.code;

  return res.status(status).json({
    success: false,
    message, // Backwards compatibility for existing frontend
    error: {
      code,
      message,
      ...(process.env.NODE_ENV !== 'production' && error?.message ? { details: error.message } : {})
    }
  });
};
module.exports = errorResponse;
