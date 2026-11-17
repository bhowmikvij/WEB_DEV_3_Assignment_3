const express = require('express');
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  adjustStock,
  deleteProduct,
  getLowStock,
  getCategorySummary,
} = require('../controllers/productController');
const { validateObjectId, requireBody, validateStockChange } = require('../middleware/validators');

const router = express.Router();

// Validates :id on every route that uses it
router.param('id', validateObjectId);

// Report routes must come BEFORE '/:id' so "low-stock" and "summary" are not treated as ids
router.get('/low-stock', getLowStock);
router.get('/summary', getCategorySummary);

router.route('/').get(getProducts).post(requireBody, createProduct);

router.route('/:id').get(getProductById).put(requireBody, updateProduct).delete(deleteProduct);

router.patch('/:id/stock', requireBody, validateStockChange, adjustStock);

module.exports = router;
