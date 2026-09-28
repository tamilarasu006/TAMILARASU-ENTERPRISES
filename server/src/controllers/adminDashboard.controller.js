const prisma = require('../prisma');
const errorResponse = require('../utils/errorResponse');

const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await prisma.user.count({ where: { role: 'CUSTOMER' } });
    
    const totalOrders = await prisma.order.count();
    const totalRevenueResult = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { status: 'COMPLETED' }
    });
    const totalRevenue = totalRevenueResult._sum.totalAmount || 0;

    const pendingOrders = await prisma.order.count({ where: { status: 'PENDING' } });
    
    const activeQuotations = await prisma.quotation.count({ 
      where: { status: { in: ['DRAFT', 'NEGOTIATION', 'SENT'] } } 
    });

    const activeShipments = await prisma.shipment.count({
      where: { status: { notIn: ['DELIVERED', 'CANCELLED'] } }
    });

    // Recent 5 Orders
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, companyName: true } } }
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalOrders,
        totalRevenue,
        pendingOrders,
        activeQuotations,
        activeShipments,
        recentOrders
      }
    });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch dashboard stats', error);
  }
};

module.exports = { getDashboardStats };
