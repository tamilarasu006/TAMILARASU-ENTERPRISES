const errorResponse = (res, status, message, error) => {
  console.error(message, error);
  return res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && error?.message ? { error: error.message } : {})
  });
};
module.exports = errorResponse;
