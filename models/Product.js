const mongoose = require('mongoose');

const CATEGORIES = [
  'Electronics',
  'Apparel',
  'Furniture',
  'Stationery',
  'Grocery',
  'Books',
  'Toys',
  'Other',
];

const isWholeNumber = {
  validator: Number.isInteger,
  message: '{PATH} must be a whole number',
};

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [2, 'Product name must be at least 2 characters'],
      maxlength: [100, 'Product name cannot exceed 100 characters'],
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      uppercase: true,
      trim: true,
      match: [
        /^[A-Z0-9]+(-[A-Z0-9]+)*$/,
        'SKU may contain only letters, numbers and hyphens (e.g. FURN-TB-812)',
      ],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      enum: {
        values: CATEGORIES,
        message: `{VALUE} is not a valid category. Allowed: ${CATEGORIES.join(', ')}`,
      },
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    quantity: {
      type: Number,
      default: 0,
      min: [0, 'Quantity cannot be negative'],
      validate: isWholeNumber,
    },
    reorderLevel: {
      type: Number,
      default: 10,
      min: [0, 'Reorder level cannot be negative'],
      validate: isWholeNumber,
    },
    supplier: {
      type: String,
      trim: true,
      maxlength: [100, 'Supplier name cannot exceed 100 characters'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Computed field: total value of stock on hand
productSchema.virtual('stockValue').get(function () {
  return Math.round(this.price * this.quantity * 100) / 100;
});

module.exports = mongoose.model('Product', productSchema);
module.exports.CATEGORIES = CATEGORIES;
