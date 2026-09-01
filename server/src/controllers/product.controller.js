const errorResponse = require('../utils/errorResponse');
const prisma = require('../prisma');
const fs = require('fs');
const path = require('path');

// Public route: returns only active products
const getProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: products });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch products', error);
  }
};

// Admin route: returns all products
const getAdminProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: products });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch admin products', error);
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch product', error);
  }
};

// Helper function to parse boolean strings from FormData
const parseBool = (val) => {
  if (val === 'true') return true;
  if (val === 'false') return false;
  return Boolean(val);
};

const createProduct = async (req, res) => {
  try {
    const data = { ...req.body };
    
    // Parse numeric and boolean fields coming from FormData
    if (data.price !== undefined) data.price = data.price ? parseFloat(data.price) : 0;
    if (data.minimumOrderQuantity !== undefined) data.minimumOrderQuantity = data.minimumOrderQuantity ? parseInt(data.minimumOrderQuantity, 10) : 1;
    if (data.stock !== undefined) data.stock = data.stock ? parseInt(data.stock, 10) : 0;
    
    if (data.priceOnRequest !== undefined) data.priceOnRequest = parseBool(data.priceOnRequest);
    if (data.exportAvailability !== undefined) data.exportAvailability = parseBool(data.exportAvailability);
    if (data.featuredProduct !== undefined) data.featuredProduct = parseBool(data.featuredProduct);
    if (data.isActive !== undefined) data.isActive = parseBool(data.isActive);
    if (data.isAvailable !== undefined) data.isAvailable = parseBool(data.isAvailable);

    // Handle image upload
    if (req.file) {
      data.imageUrl = req.file.path; // Cloudinary URL
    }

    const product = await prisma.product.create({ data });
    res.status(201).json({ success: true, message: 'Product created successfully', data: product });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to create product', error);
  }
};

const updateProduct = async (req, res) => {
  try {
    const data = { ...req.body };
    
    // Parse numeric and boolean fields coming from FormData
    if (data.price !== undefined) data.price = data.price ? parseFloat(data.price) : 0;
    if (data.minimumOrderQuantity !== undefined) data.minimumOrderQuantity = data.minimumOrderQuantity ? parseInt(data.minimumOrderQuantity, 10) : 1;
    if (data.stock !== undefined) data.stock = data.stock ? parseInt(data.stock, 10) : 0;
    
    if (data.priceOnRequest !== undefined) data.priceOnRequest = parseBool(data.priceOnRequest);
    if (data.exportAvailability !== undefined) data.exportAvailability = parseBool(data.exportAvailability);
    if (data.featuredProduct !== undefined) data.featuredProduct = parseBool(data.featuredProduct);
    if (data.isActive !== undefined) data.isActive = parseBool(data.isActive);
    if (data.isAvailable !== undefined) data.isAvailable = parseBool(data.isAvailable);

    // Handle image upload
    if (req.file) {
      data.imageUrl = req.file.path; // Cloudinary URL
    }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data
    });
    res.json({ success: true, message: 'Product updated successfully', data: product });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to update product', error);
  }
};

const updateProductStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { isActive: parseBool(isActive) }
    });
    res.json({ success: true, message: 'Product status updated successfully', data: product });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to update product status', error);
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    
    // Check if product is used in orders (if implemented, prevent deletion, but we'll do soft delete logic or just delete)
    const orderItems = await prisma.orderItem.count({ where: { productId: req.params.id } });
    if (orderItems > 0) {
      // Soft delete instead
      await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false, isAvailable: false } });
      return res.json({ success: true, message: 'Product has active orders. Soft-deleted successfully (set to inactive).' });
    }

    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to delete product', error);
  }
};

module.exports = { getProducts, getAdminProducts, getProductById, createProduct, updateProduct, updateProductStatus, deleteProduct };