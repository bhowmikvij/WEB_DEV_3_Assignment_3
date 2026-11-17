// Run with: npm run seed   (WARNING: deletes all existing products first)
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const products = [
  { name: 'Study Table', sku: 'FURN-TB-812', category: 'Furniture', price: 3999, quantity: 2, reorderLevel: 4, supplier: 'IKEA India' },
  { name: 'Office Chair', sku: 'FURN-CH-310', category: 'Furniture', price: 6499, quantity: 15, reorderLevel: 5, supplier: 'Godrej Interio' },
  { name: 'Wireless Mouse', sku: 'ELEC-MS-101', category: 'Electronics', price: 799, quantity: 40, reorderLevel: 10, supplier: 'Logitech' },
  { name: 'Bluetooth Speaker', sku: 'ELEC-SP-204', category: 'Electronics', price: 2499, quantity: 6, reorderLevel: 10, supplier: 'boAt' },
  { name: 'Laptop 15 inch', sku: 'ELEC-LP-550', category: 'Electronics', price: 55999, quantity: 8, reorderLevel: 3, supplier: 'Lenovo' },
  { name: 'USB-C Charger', sku: 'ELEC-CH-077', category: 'Electronics', price: 1299, quantity: 42, reorderLevel: 15, supplier: 'Anker' },
  { name: 'Cotton T-Shirt', sku: 'APRL-TS-120', category: 'Apparel', price: 499, quantity: 60, reorderLevel: 20, supplier: 'Allen Solly' },
  { name: 'Denim Jacket', sku: 'APRL-JK-045', category: 'Apparel', price: 2299, quantity: 18, reorderLevel: 5, supplier: 'Levis' },
  { name: 'A4 Notebook Pack of 5', sku: 'STNY-NB-220', category: 'Stationery', price: 250, quantity: 12, reorderLevel: 25, supplier: 'Classmate' },
  { name: 'Highlighter Set', sku: 'STNY-HL-330', category: 'Stationery', price: 180, quantity: 3, reorderLevel: 10, supplier: 'Camlin' },
  { name: 'Basmati Rice 5kg', sku: 'GROC-RC-001', category: 'Grocery', price: 620, quantity: 30, reorderLevel: 10, supplier: 'India Gate' },
  { name: 'Olive Oil 1L', sku: 'GROC-OL-014', category: 'Grocery', price: 899, quantity: 25, reorderLevel: 8, supplier: 'Figaro' },
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Product.init();
    await Product.deleteMany({});
    const created = await Product.insertMany(products);
    console.log(`Seeded ${created.length} products`);
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
