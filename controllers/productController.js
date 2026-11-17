const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const ALLOWED_FIELDS = ['name', 'sku', 'category', 'price', 'quantity', 'reorderLevel', 'supplier'];
const SORTABLE_FIELDS = ['name', 'sku', 'category', 'price', 'quantity', 'createdAt', 'updatedAt'];

// Only copy whitelisted fields from the request body
const pickAllowed = (body) =>
  ALLOWED_FIELDS.reduce((acc, key) => {
    if (body[key] !== undefined) acc[key] = body[key];
    return acc;
  }, {});

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toNumber = (value, name) => {
  const n = Number(value);
  if (Number.isNaN(n)) throw new AppError(`'${name}' must be a number`, 400);
  return n;
};

// POST /api/products
const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(pickAllowed(req.body));
  res.status(201).json(product);
});

// GET /api/products?category=&supplier=&search=&minPrice=&maxPrice=&inStock=&sort=&page=&limit=
const getProducts = asyncHandler(async (req, res) => {
  const { category, supplier, search, minPrice, maxPrice, inStock } = req.query;
  const filter = {};

  if (category) filter.category = new RegExp(`^${escapeRegex(category)}$`, 'i');
  if (supplier) filter.supplier = new RegExp(escapeRegex(supplier), 'i');
  if (search) filter.name = new RegExp(escapeRegex(search), 'i');

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = toNumber(minPrice, 'minPrice');
    if (maxPrice !== undefined) filter.price.$lte = toNumber(maxPrice, 'maxPrice');
  }

  if (inStock === 'true') filter.quantity = { $gt: 0 };
  else if (inStock === 'false') filter.quantity = 0;

  // Sorting: ?sort=-price,name  (prefix with - for descending)
  let sortBy = '-createdAt';
  if (req.query.sort) {
    const fields = String(req.query.sort).split(',').map((f) => f.trim()).filter(Boolean);
    for (const f of fields) {
      if (!SORTABLE_FIELDS.includes(f.replace(/^-/, ''))) {
        throw new AppError(`Cannot sort by '${f}'. Allowed: ${SORTABLE_FIELDS.join(', ')}`, 400);
      }
    }
    if (fields.length) sortBy = fields.join(' ');
  }

  // Pagination
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);

  const [total, products] = await Promise.all([
    Product.countDocuments(filter),
    Product.find(filter)
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  res.json({
    total,
    page,
    totalPages: Math.ceil(total / limit),
    count: products.length,
    products,
  });
});

// GET /api/products/:id
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('Product not found', 404);
  res.json(product);
});

// PUT /api/products/:id
const updateProduct = asyncHandler(async (req, res) => {
  const updates = pickAllowed(req.body);
  if (Object.keys(updates).length === 0) {
    throw new AppError(`No valid fields to update. Allowed: ${ALLOWED_FIELDS.join(', ')}`, 400);
  }
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true, runValidators: true }
  );
  if (!product) throw new AppError('Product not found', 404);
  res.json(product);
});

// PATCH /api/products/:id/stock   body: { "change": 10 } or { "change": -3 }
// Uses a single atomic update so stock can never go below zero, even with concurrent requests.
const adjustStock = asyncHandler(async (req, res) => {
  const { change } = req.body;
  const filter = { _id: req.params.id };
  if (change < 0) filter.quantity = { $gte: -change };

  const product = await Product.findOneAndUpdate(filter, { $inc: { quantity: change } }, { new: true });

  if (!product) {
    const exists = await Product.exists({ _id: req.params.id });
    if (!exists) throw new AppError('Product not found', 404);
    throw new AppError(`Insufficient stock: cannot reduce quantity by ${-change}`, 400);
  }

  res.json({ message: 'Stock updated', product });
});

// DELETE /api/products/:id
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new AppError('Product not found', 404);
  res.json({ message: 'Product deleted', id: product.id });
});

// GET /api/products/low-stock   (quantity <= reorderLevel) - aggregation pipeline
const getLowStock = asyncHandler(async (req, res) => {
  const lowStockItems = await Product.aggregate([
    { $match: { $expr: { $lte: ['$quantity', '$reorderLevel'] } } },
    {
      $addFields: {
        stockValue: { $multiply: ['$price', '$quantity'] },
        id: { $toString: '$_id' },
      },
    },
    { $sort: { quantity: 1, name: 1 } },
  ]);

  res.json({ count: lowStockItems.length, lowStockItems });
});

// GET /api/products/summary   (category-wise inventory summary) - aggregation pipeline
const getCategorySummary = asyncHandler(async (req, res) => {
  const summary = await Product.aggregate([
    {
      $group: {
        _id: '$category',
        totalItems: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' },
        totalStockValue: { $sum: { $multiply: ['$price', '$quantity'] } },
        avgPrice: { $avg: '$price' },
      },
    },
    { $addFields: { avgPrice: { $round: ['$avgPrice', 2] } } },
    { $sort: { totalStockValue: -1 } },
  ]);

  res.json({ categories: summary.length, summary });
});

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  adjustStock,
  deleteProduct,
  getLowStock,
  getCategorySummary,
};
