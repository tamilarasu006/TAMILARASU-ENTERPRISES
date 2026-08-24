const prisma = require('../prisma');

const getProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany();
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch products', error: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch product', error: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const product = await prisma.product.create({ data: req.body });
    res.status(201).json({ success: true, message: 'Product created', data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create product', error: error.message });
  }
};

module.exports = { getProducts, getProductById, createProduct };