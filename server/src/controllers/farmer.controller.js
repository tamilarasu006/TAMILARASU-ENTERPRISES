const errorResponse = require('../utils/errorResponse');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');

// Farmer Registration
const registerFarmer = async (req, res) => {
  try {
    let { name, email, phone, password, farmName, farmLocation, district, state, pincode, farmSize, farmingType, mainProducts } = req.body;
    
    // Normalize
    email = email?.toLowerCase().trim();
    phone = phone?.trim();

    if (!email || !password || !name || !phone || !farmName) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    // Check duplicate
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) return res.status(400).json({ success: false, message: 'Email already exists' });
      if (existingUser.phone === phone) return res.status(400).json({ success: false, message: 'Mobile number already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user and profile in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { 
          name, 
          email, 
          password: hashedPassword, 
          phone,
          role: 'FARMER',
          emailVerified: false 
        }
      });
      
      const profile = await tx.farmerProfile.create({
        data: {
          userId: user.id,
          farmName,
          farmLocation,
          district,
          state,
          pincode,
          farmSize,
          farmingType,
          mainProducts,
          verificationStatus: 'PENDING'
        }
      });
      
      return { user, profile };
    });
    
    res.status(201).json({ success: true, message: 'Farmer registration successful. Please wait for verification.' });
  } catch (error) {
    console.error(error);
    return errorResponse(res, 500, 'Registration failed', error);
  }
};

// Farmer Login
const loginFarmer = async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    
    const identifier = email?.toLowerCase().trim() || phone?.trim();
    
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email/phone and password.' });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phone: identifier }],
        role: 'FARMER'
      },
      include: {
        farmerProfile: true
      }
    });

    if (!user) return res.status(400).json({ success: false, message: 'Invalid credentials or you are not registered as a farmer.' });
    
    if (!user.password) {
      return res.status(400).json({ success: false, message: 'Please use appropriate login method.' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid credentials.' });
    
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    return res.json({ 
      success: true, 
      message: 'Login successful', 
      data: { 
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          role: user.role,
          verificationStatus: user.farmerProfile?.verificationStatus 
        }, 
        token 
      } 
    });
  } catch (error) {
    console.error(error);
    return errorResponse(res, 500, 'Login failed', error);
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const farmerId = req.user.id;
    
    const products = await prisma.farmerProduct.findMany({
      where: { farmerId }
    });
    
    const enquiries = await prisma.productEnquiry.findMany({
      where: { farmerId }
    });
    
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: { farmerId }
    });
    
    const stats = {
      totalProducts: products.length,
      underReview: products.filter(p => p.status === 'UNDER_REVIEW').length,
      approvedProducts: products.filter(p => p.status === 'SHORTLISTED' || p.status === 'PURCHASED').length,
      rejectedProducts: products.filter(p => p.status === 'REJECTED').length,
      activeEnquiries: enquiries.filter(e => e.status !== 'CANCELLED' && e.status !== 'EXPIRED').length,
      completedPurchases: purchaseOrders.filter(po => po.procurementStatus === 'COMPLETED').length
    };
    
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error(error);
    return errorResponse(res, 500, 'Failed to get dashboard stats', error);
  }
};

const addProduct = async (req, res) => {
  try {
    const farmerId = req.user.id;
    const {
      name, category, variety, description,
      grade, qualityDesc, farmingMethod, isOrganic, size, appearance, freshness,
      availableQty, unit, minOrderQty, harvestDate, readyDate,
      expectedPrice, priceUnit, paymentTerms,
      farmName, farmLocation, district, state, pincode
    } = req.body;

    const product = await prisma.farmerProduct.create({
      data: {
        farmerId,
        name, category, variety, description,
        grade, qualityDesc, farmingMethod, isOrganic: isOrganic === 'true' || isOrganic === true, 
        size, appearance, freshness,
        availableQty: Number(availableQty), unit, 
        minOrderQty: minOrderQty ? Number(minOrderQty) : 0, 
        harvestDate: harvestDate ? new Date(harvestDate) : null, 
        readyDate: readyDate ? new Date(readyDate) : null,
        expectedPrice: Number(expectedPrice), priceUnit, paymentTerms,
        farmName, farmLocation, district, state, pincode,
        status: 'SUBMITTED' // Enters workflow
      }
    });

    if (req.files && req.files.length > 0) {
      const imageRecords = req.files.map((file, index) => ({
        farmerProductId: product.id,
        url: file.path,
        isPrimary: index === 0
      }));
      await prisma.farmerProductImage.createMany({
        data: imageRecords
      });
    }

    res.status(201).json({ success: true, message: 'Product submitted for review!', data: product });
  } catch (error) {
    console.error(error);
    return errorResponse(res, 500, 'Failed to add product', error);
  }
};

const getMyProducts = async (req, res) => {
  try {
    const products = await prisma.farmerProduct.findMany({
      where: { farmerId: req.user.id },
      include: { images: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: products });
  } catch (error) {
    console.error(error);
    return errorResponse(res, 500, 'Failed to fetch products', error);
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // check if it belongs to farmer
    const product = await prisma.farmerProduct.findUnique({ where: { id } });
    if (!product || product.farmerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized or not found' });
    }

    await prisma.farmerProductImage.deleteMany({ where: { farmerProductId: id } });
    await prisma.farmerProduct.delete({ where: { id } });

    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    console.error(error);
    return errorResponse(res, 500, 'Failed to delete product', error);
  }
};

module.exports = {
  registerFarmer,
  loginFarmer,
  getDashboardStats,
  addProduct,
  getMyProducts,
  deleteProduct
};
