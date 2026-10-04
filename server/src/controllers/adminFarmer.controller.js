const prisma = require('../prisma');

const getAllFarmerProducts = async (req, res) => {
  try {
    const products = await prisma.farmerProduct.findMany({
      include: {
        images: true,
        farmer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ success: true, data: products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch farmer products' });
  }
};

const updateFarmerProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'REJECTED', 'PROCURED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const updatedProduct = await prisma.farmerProduct.update({
      where: { id },
      data: { status }
    });

    res.json({ success: true, message: `Product status updated to ${status}`, data: updatedProduct });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to update product status' });
  }
};

module.exports = {
  getAllFarmerProducts,
  updateFarmerProductStatus
};
