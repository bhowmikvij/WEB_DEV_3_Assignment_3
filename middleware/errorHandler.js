const notFound = (req, res, next) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
};

const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors;

  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid value for '${err.path}'`;
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = `Duplicate value: ${field} '${err.keyValue[field]}' already exists`;
  } else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    status = 400;
    message = 'Invalid JSON in request body';
  }

  if (status === 500) console.error(err);

  res.status(status).json({ success: false, message, ...(errors && { errors }) });
};

module.exports = { notFound, errorHandler };
