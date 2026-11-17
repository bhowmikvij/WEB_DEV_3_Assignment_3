const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

// Used with router.param('id', ...)
const validateObjectId = (req, res, next, id) => {
  if (!mongoose.isValidObjectId(id)) {
    return next(new AppError(`Invalid product id: ${id}`, 400));
  }
  next();
};

// Body must be a non-empty JSON object
const requireBody = (req, res, next) => {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length === 0) {
    return next(new AppError('Request body is required (send JSON with Content-Type: application/json)', 400));
  }
  next();
};

// PATCH /:id/stock  ->  { "change": 10 } (restock) or { "change": -3 } (sale)
const validateStockChange = (req, res, next) => {
  const { change } = req.body || {};
  if (typeof change !== 'number' || !Number.isInteger(change) || change === 0) {
    return next(
      new AppError("'change' must be a non-zero whole number (positive = restock, negative = sale)", 400)
    );
  }
  next();
};

module.exports = { validateObjectId, requireBody, validateStockChange };
